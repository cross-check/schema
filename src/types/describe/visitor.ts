import { unknown } from "ts-std";
import {
  DictionaryLabel,
  GenericLabel,
  IteratorLabel,
  Label,
  ListLabel,
  NamedLabel,
  Optionality,
  PointerLabel,
  PrimitiveLabel,
  SchemaType
} from "./label";
import { Accumulator, Position, Reporter, genericPosition } from "./reporter";

export interface VisitorDelegate {
  primitive(label: Label<PrimitiveLabel>, position: Position): unknown;
  generic(label: Label<GenericLabel>, position: Position): unknown;
  dictionary(label: Label<DictionaryLabel>, position: Position): unknown;
  named(label: NamedLabel, position: Position): unknown;
}

export class Visitor {
  constructor(private delegate: VisitorDelegate) {}

  visit(label: Label, position: Position = Position.Any): unknown {
    if (isNamed(label)) {
      return this.delegate.named(label, position);
    }

    switch (label.type.kind) {
      case "primitive": {
        return this.delegate.primitive(
          label as Label<PrimitiveLabel>,
          position
        );
      }

      case "list": {
        return this.delegate.generic(label as Label<ListLabel>, position);
      }

      case "dictionary": {
        return this.delegate.dictionary(
          label as Label<DictionaryLabel>,
          position
        );
      }

      case "pointer": {
        return this.delegate.generic(label as Label<PointerLabel>, position);
      }

      case "iterator":
        return this.delegate.generic(label as Label<IteratorLabel>, position);
    }
  }
}

export function isRequired(label: Label | Optionality): boolean {
  let optionality = label.hasOwnProperty("optionality")
    ? (label as Label).optionality
    : label;

  return optionality === Optionality.Required;
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

export class RecursiveVisitor<D extends RecursiveDelegate> {
  static build<D extends RecursiveDelegate>(delegate: D): RecursiveVisitor<D> {
    let recursiveVisitor = new RecursiveVisitor(delegate);
    let visitor = new Visitor(recursiveVisitor);
    recursiveVisitor.visitor = visitor;
    return recursiveVisitor;
  }

  private visitor!: Visitor;

  private constructor(private recursiveDelegate: D) {}

  primitive(label: Label<PrimitiveLabel>): unknown {
    let type = label.type.schemaType;
    let required = label.optionality === Optionality.Required;

    return this.recursiveDelegate.primitive(type, required);
  }

  generic(label: Label<GenericLabel>): unknown {
    return this.recursiveDelegate.generic(
      this.visitor.visit(
        label.type.of,
        genericPosition(label.type.kind)
      ) as ItemType<D>,
      label.type,
      isRequired(label)
    );
  }

  dictionary(label: Label<DictionaryLabel>, position: Position): unknown {
    if (position === Position.WholeSchema) {
      return this.recursiveDelegate.schema(label.type, isRequired(label));
    } else {
      return this.recursiveDelegate.dictionary(label.type, isRequired(label));
    }
  }

  named(label: NamedLabel): unknown {
    return this.recursiveDelegate.named(label, isRequired(label));
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

  primitive(label: Label<PrimitiveLabel>, position: Position): unknown {
    this.reporter.handleEvent(
      "startPrimitiveValue",
      debug(label),
      position,
      label
    );
    this.reporter.handleEvent("primitiveValue", debug(label), position, label);
    this.reporter.handleEvent(
      "endPrimitiveValue",
      debug(label),
      position,
      label
    );
  }

  named(label: NamedLabel, position: Position): unknown {
    this.reporter.handleEvent("startNamedValue", debug(label), position, label);
    this.reporter.handleEvent("namedValue", debug(label), position, label);
    this.reporter.handleEvent("endNamedValue", debug(label), position, label);
  }

  generic(label: Label<GenericLabel>, position: Position): unknown {
    this.reporter.handleEvent(
      "startGenericValue",
      debug(label),
      position,
      label
    );
    this.visitor.visit(label.type.of, genericPosition(label.type.kind));
    this.reporter.handleEvent("endGenericValue", debug(label), position, label);
  }

  dictionary(label: Label<DictionaryLabel>, position: Position): Inner {
    if (position === Position.WholeSchema) {
      this.reporter.handleEvent("startSchema", debug(label), position, label);
    } else {
      this.reporter.handleEvent(
        "startDictionary",
        debug(label),
        position,
        label
      );
    }

    let dictionary = label.type;
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

      this.reporter.addKey(key, itemPosition, members[key]!.optionality);
      this.visitor.visit(members[key]!, itemPosition);
      this.reporter.handleEvent(
        "endValue",
        debug(label),
        itemPosition,
        members[key]!
      );
    });

    if (position === Position.WholeSchema) {
      this.reporter.handleEvent("endSchema", debug(label), position, label);
    } else {
      this.reporter.handleEvent("endDictionary", debug(label), position, label);
    }

    return this.reporter.finish();
  }
}

function debug(label: Label) {
  return label.type.kind;
}

function isNamed<T extends Label>(label: T): label is T & { name: string } {
  return typeof label.name === "string";
}
