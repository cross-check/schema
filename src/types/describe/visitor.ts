import { unknown } from "ts-std";
import {
  DictionaryLabel,
  Label,
  ListLabel,
  NamedLabel,
  Optionality,
  PointerLabel,
  PrimitiveLabel,
  SchemaType
} from "./label";
import { Accumulator, Position, Reporter } from "./reporter";

export interface VisitorDelegate {
  primitive(label: Label<PrimitiveLabel>, position: Position): unknown;
  list(label: Label<ListLabel>, position: Position): unknown;
  dictionary(label: Label<DictionaryLabel>, position: Position): unknown;
  pointer(label: Label<PointerLabel>, position: Position): unknown;
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
        return this.delegate.list(label as Label<ListLabel>, position);
      }

      case "dictionary": {
        return this.delegate.dictionary(
          label as Label<DictionaryLabel>,
          position
        );
      }

      case "pointer": {
        return this.delegate.pointer(label as Label<PointerLabel>, position);
      }
    }
  }
}

export function isRequired(
  position: Position,
  label: Label | Optionality
): boolean {
  let optionality = label.hasOwnProperty("optionality")
    ? (label as Label).optionality
    : label;

  return position === Position.Only || optionality === Optionality.Required;
}

export interface RecursiveDelegate {
  named(label: NamedLabel, required: boolean): unknown;
  primitive(type: SchemaType, required: boolean): unknown;
  list(item: ItemType<this>, required: boolean): unknown;
  pointer(entity: ItemType<this>, required: boolean): unknown;
  dictionary(label: DictionaryLabel, required: boolean): unknown;
  schema(label: DictionaryLabel, required: boolean): unknown;
}

export type ItemType<D extends RecursiveDelegate> =
  | ReturnType<D["primitive"]>
  | ReturnType<D["list"]>
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

  primitive(label: Label<PrimitiveLabel>, position: Position): unknown {
    let type = label.type.schemaType;
    let required =
      position === Position.Only || label.optionality === Optionality.Required;

    return this.recursiveDelegate.primitive(type, required);
  }

  pointer(label: Label<PointerLabel>, position: Position): unknown {
    return this.recursiveDelegate.pointer(
      this.visitor.visit(label.type.entity, Position.Only) as ItemType<D>,
      isRequired(position, label)
    );
  }

  list(label: Label<ListLabel>, position: Position): unknown {
    return this.recursiveDelegate.list(
      this.visitor.visit(label.type.item, Position.Only) as ItemType<D>,
      isRequired(position, label)
    );
  }

  dictionary(label: Label<DictionaryLabel>, position: Position): unknown {
    if (position === Position.WholeSchema) {
      return this.recursiveDelegate.schema(
        label.type,
        isRequired(position, label)
      );
    } else {
      return this.recursiveDelegate.dictionary(
        label.type,
        isRequired(position, label)
      );
    }
  }

  named(label: NamedLabel, position: Position): unknown {
    return this.recursiveDelegate.named(label, isRequired(position, label));
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

export class StringVisitor<Buffer extends Accumulator<Inner>, Inner, Options> {
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
    this.reporter.startPrimitiveValue(position, label.optionality);
    this.reporter.primitiveValue(label);
    this.reporter.endPrimitiveValue(position, label.optionality);
  }

  named(label: NamedLabel, position: Position): unknown {
    this.reporter.startNamedValue(position, label.optionality);
    this.reporter.namedValue(label);
    this.reporter.endNamedValue(position, label.optionality);
  }

  pointer(label: Label<PointerLabel>, position: Position): unknown {
    this.reporter.startReferenceValue(position, label);
    this.visitor.visit(label.type.entity, Position.Only);
    this.reporter.endReferenceValue(position, label);
  }

  list(label: Label<ListLabel>, position: Position): unknown {
    this.reporter.startListValue(position, label.optionality);
    this.visitor.visit(label.type.item, Position.Only);
    this.reporter.endListValue(position, label.optionality);
  }

  dictionary(label: Label<DictionaryLabel>, position: Position): Inner {
    this.reporter.startDictionary(position);

    let dictionary = label.type;
    let members = dictionary.members;
    let keys = Object.keys(dictionary.members);
    let last = keys.length - 1;

    keys.forEach((key, i) => {
      let itemPosition: Position;

      switch (i) {
        case 0:
          itemPosition = Position.First;
          break;
        case last:
          itemPosition = Position.Last;
          break;
        default:
          itemPosition = Position.Middle;
      }

      this.reporter.addKey(key, itemPosition, members[key]!.optionality);
      this.visitor.visit(members[key]!, itemPosition);
    });

    this.reporter.endDictionary(position, label.optionality);

    return this.reporter.finish();
  }
}

function isNamed<T extends Label>(label: T): label is T & { name: string } {
  return typeof label.name === "string";
}
