import { unknown } from "ts-std";
import { LabelledType, NamedType, Type } from "../fundamental/value";
import {
  DictionaryLabel,
  GenericLabel,
  Label,
  NamedLabel,
  PrimitiveLabel,
  TypeLabel
} from "./label";
import { Accumulator, Position, Reporter, genericPosition } from "./reporter";

export interface VisitorDelegate {
  schema(type: LabelledType<DictionaryLabel>, position: Position): unknown;
  dictionary(type: LabelledType<DictionaryLabel>, position: Position): unknown;
  named(type: LabelledType, position: Position): unknown;
  primitive(type: LabelledType<PrimitiveLabel>, position: Position): unknown;
  generic(type: LabelledType<GenericLabel>, position: Position): unknown;
}

export class Visitor {
  constructor(private delegate: VisitorDelegate) {}

  visit(type: Type, position: Position = Position.Any): unknown {
    if (isNamed(type)) {
      return this.delegate.named(type as LabelledType<TypeLabel>, position);
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
        if (position === Position.WholeSchema) {
          return this.delegate.schema(
            type as LabelledType<DictionaryLabel>,
            position
          );
        } else {
          return this.delegate.dictionary(
            type as LabelledType<DictionaryLabel>,
            position
          );
        }
      }
    }
  }
}

export interface RecursiveDelegate {
  named(label: NamedLabel, required: boolean): unknown;
  primitive(type: Label<PrimitiveLabel>, required: boolean): unknown;
  generic(
    of: ItemType<this>,
    label: Label<GenericLabel>,
    required: boolean
  ): unknown;
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
    return this.recursiveDelegate.primitive(label, isRequired);
  }

  generic({ label, isRequired }: LabelledType<GenericLabel>): unknown {
    return this.recursiveDelegate.generic(
      this.visitor.visit(
        label.type.of,
        genericPosition(label.type.kind)
      ) as ItemType<D>,
      label,
      isRequired
    );
  }

  schema({ label, isRequired }: LabelledType<DictionaryLabel>): unknown {
    return this.recursiveDelegate.schema(label.type, isRequired);
  }

  dictionary({ label, isRequired }: LabelledType<DictionaryLabel>): unknown {
    return this.recursiveDelegate.dictionary(label.type, isRequired);
  }

  named({ label, isRequired }: NamedType<TypeLabel>): unknown {
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
    this.reporter.primitiveValue(position, type);
  }

  named(type: LabelledType<TypeLabel>, position: Position): unknown {
    this.reporter.namedValue(position, type);
  }

  generic(type: LabelledType<GenericLabel>, position: Position): unknown {
    this.reporter.startGenericValue(position, type);

    this.visitor.visit(
      type.label.type.of,
      genericPosition(type.label.type.kind)
    );

    this.reporter.endGenericValue(position, type);
  }

  schema(type: LabelledType<DictionaryLabel>, position: Position): Inner {
    this.reporter.startSchema();
    this.dictionaryBody(position, type);
    this.reporter.endSchema();

    return this.reporter.finish();
  }

  dictionary(type: LabelledType<DictionaryLabel>, position: Position): void {
    this.reporter.startDictionary(position);
    this.dictionaryBody(position, type);
    this.reporter.endDictionary(position, type);
  }

  dictionaryBody(_position: Position, type: LabelledType<DictionaryLabel>) {
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

      this.reporter.addKey(key, itemPosition, members[key]!);
      this.visitor.visit(members[key]!, itemPosition);
      this.reporter.endValue(itemPosition, members[key]!);
    });
  }
}

function isNamed(type: Type): boolean {
  return !!type.label.registeredName;
}
