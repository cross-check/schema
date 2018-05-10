import { unknown } from "ts-std";
import { LabelledType, NamedType, Type } from "../fundamental/value";
import {
  ANONYMOUS,
  DictionaryLabel,
  GenericLabel,
  NamedLabel,
  Optionality,
  PrimitiveLabel,
  SchemaType,
  TypeLabel
} from "./label";
import { Accumulator, Position, Reporter, genericPosition } from "./reporter";

export interface VisitorDelegate {
  primitive(type: LabelledType<PrimitiveLabel>, position: Position): unknown;
  generic(type: LabelledType<GenericLabel>, position: Position): unknown;
  dictionary(type: LabelledType<DictionaryLabel>, position: Position): unknown;
  named(type: NamedType, position: Position): unknown;
}

export class Visitor {
  constructor(private delegate: VisitorDelegate) {}

  visit(type: Type, position: Position = Position.Any): unknown {
    if (isNamed(type)) {
      debugger;
      return this.delegate.named(
        type as LabelledType<TypeLabel, { name: string }>,
        position
      );
    }

    let label = type.label;

    switch (label.type.kind) {
      case "primitive": {
        return this.delegate.primitive(
          type as LabelledType<PrimitiveLabel>,
          position
        );
      }

      case "pointer":
      case "iterator":
      case "list": {
        return this.delegate.generic(
          type as LabelledType<GenericLabel>,
          position
        );
      }

      case "dictionary": {
        return this.delegate.dictionary(
          type as LabelledType<DictionaryLabel>,
          position
        );
      }
    }
  }
}

export interface RecursiveDelegate {
  named(label: NamedLabel, required: boolean): unknown;
  primitive(type: SchemaType, required: boolean): unknown;
  generic(of: ItemType<this>, label: GenericLabel, required: boolean): unknown;
  dictionary(label: DictionaryLabel, required: boolean): unknown;
  schema(label: DictionaryLabel, required: boolean): unknown;
}

export type ItemType<D extends RecursiveDelegate> =
  | ReturnType<D["primitive"]>
  | ReturnType<D["generic"]>
  | ReturnType<D["dictionary"]>;

export class RecursiveVisitor<D extends RecursiveDelegate>
  implements VisitorDelegate {
  static build<D extends RecursiveDelegate>(delegate: D): RecursiveVisitor<D> {
    let recursiveVisitor = new RecursiveVisitor(delegate);
    let visitor = new Visitor(recursiveVisitor);
    recursiveVisitor.visitor = visitor;
    return recursiveVisitor;
  }

  private visitor!: Visitor;

  private constructor(private recursiveDelegate: D) {}

  primitive({ label, isRequired }: LabelledType<PrimitiveLabel>): unknown {
    let schemaType = label.type.schemaType;

    return this.recursiveDelegate.primitive(schemaType, isRequired);
  }

  generic({ label, isRequired }: LabelledType<GenericLabel>): unknown {
    return this.recursiveDelegate.generic(
      this.visitor.visit(
        label.type.of,
        genericPosition(label.type.kind)
      ) as ItemType<D>,
      label.type,
      isRequired
    );
  }

  dictionary(
    { label, isRequired }: LabelledType<DictionaryLabel>,
    position: Position
  ): unknown {
    if (position === Position.WholeSchema) {
      return this.recursiveDelegate.schema(label.type, isRequired);
    } else {
      return this.recursiveDelegate.dictionary(label.type, isRequired);
    }
  }

  named({
    label,
    isRequired
  }: LabelledType<TypeLabel, { name: string }>): unknown {
    return this.recursiveDelegate.named(label, isRequired);
  }

  processDictionary(
    label: DictionaryLabel,
    callback: (item: ItemType<D>, key: string) => void
  ): unknown {
    let input = label.members;
    let keys = Object.keys(input);
    let last = keys.length - 1;

    keys.forEach((key, i) => {
      let dictPosition: Position;

      if (i === 0) {
        dictPosition = Position.First;
      } else if (i === last) {
        dictPosition = Position.Last;
      } else {
        dictPosition = Position.Middle;
      }

      callback(
        this.visitor.visit(input[key]!, dictPosition) as ItemType<D>,
        key
      );
    });
  }
}

export class StringVisitor<Buffer extends Accumulator<Inner>, Inner, Options>
  implements VisitorDelegate {
  static build<Buffer extends Accumulator<Inner>, Inner, Options>(
    reporter: Reporter<Buffer, Inner, Options>
  ): StringVisitor<Buffer, Inner, Options> {
    let stringVisitor = new StringVisitor(reporter);
    let visitor = new Visitor(stringVisitor);
    stringVisitor.visitor = visitor;
    return stringVisitor;
  }

  private visitor!: Visitor;

  private constructor(private reporter: Reporter<Buffer, Inner, Options>) {}

  primitive(type: LabelledType<PrimitiveLabel>, position: Position): unknown {
    this.reporter.handleEvent(
      "startPrimitiveValue",
      debug(type),
      position,
      type
    );
    this.reporter.handleEvent("primitiveValue", debug(type), position, type);
    this.reporter.handleEvent("endPrimitiveValue", debug(type), position, type);
  }

  named(
    type: LabelledType<TypeLabel, { name: string }>,
    position: Position
  ): unknown {
    let { label } = type;

    this.reporter.handleEvent("startNamedValue", debug(type), position, type);
    this.reporter.handleEvent("namedValue", debug(type), position, type);

    if (label.templated) {
      this.reporter.handleEvent(
        "startTemplatedValue",
        debug(type),
        position,
        type
      );
      this.visitor.visit({
        ...type,
        label: { ...type.label, name: ANONYMOUS }
      });
      this.reporter.handleEvent(
        "endTemplatedValue",
        debug(type),
        position,
        type
      );
    }

    this.reporter.handleEvent("endNamedValue", debug(type), position, type);
  }

  generic(type: LabelledType<GenericLabel>, position: Position): unknown {
    this.reporter.handleEvent("startGenericValue", debug(type), position, type);

    this.visitor.visit(
      type.label.type.of,
      genericPosition(type.label.type.kind)
    );
    this.reporter.handleEvent("endGenericValue", debug(type), position, type);
  }

  dictionary(type: LabelledType<DictionaryLabel>, position: Position): Inner {
    if (position === Position.WholeSchema) {
      this.reporter.handleEvent("startSchema", debug(type), position, type);
    } else {
      this.reporter.handleEvent("startDictionary", debug(type), position, type);
    }

    let dictionary = type.label.type;
    let members = dictionary.members;
    let keys = Object.keys(dictionary.members);
    let last = keys.length - 1;

    keys.forEach((key, i) => {
      let itemPosition: Position;

      switch (i) {
        case 0:
          itemPosition = last === 0 ? Position.Only : Position.First;
          break;
        case last:
          itemPosition = Position.Last;
          break;
        default:
          itemPosition = Position.Middle;
      }

      this.reporter.addKey(
        key,
        itemPosition,
        optionality(members[key]!.isRequired)
      );
      this.visitor.visit(members[key]!, itemPosition);
      this.reporter.handleEvent(
        "endValue",
        debug(members[key]!),
        itemPosition,
        members[key]!
      );
    });

    if (position === Position.WholeSchema) {
      this.reporter.handleEvent("endSchema", debug(type), position, type);
    } else {
      this.reporter.handleEvent("endDictionary", debug(type), position, type);
    }

    return this.reporter.finish();
  }
}

function optionality(required: boolean): Optionality {
  return required ? Optionality.Required : Optionality.Optional;
}

function debug({ label }: Type) {
  return label.type.kind;
}

function isNamed(type: Type): boolean {
  let name = type.label.name;
  return name && typeof name === "object" && "name" in name;
}
