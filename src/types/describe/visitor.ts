import { unknown } from "ts-std";
import {
  DictionaryLabel,
  Label,
  ListLabel,
  Optionality,
  PrimitiveLabel,
  SchemaType
} from "./label";
import { Accumulator, Position, Reporter } from "./reporter";

export interface VisitorDelegate {
  primitive(label: Label<PrimitiveLabel>, position: Position): unknown;
  list(label: Label<ListLabel>, position: Position): unknown;
  dictionary(label: Label<DictionaryLabel>, position: Position): unknown;
}

export class Visitor {
  constructor(private delegate: VisitorDelegate) {}

  visit(label: Label, position: Position = Position.Any): unknown {
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
  primitive(type: SchemaType, required: boolean): unknown;
  list(item: ItemType<this>, required: boolean): unknown;
  dictionary(label: DictionaryLabel, required: boolean): unknown;
  schema(label: DictionaryLabel, required: boolean): unknown;
}

export type ItemType<D extends RecursiveDelegate> =
  | ReturnType<D["primitive"]>
  | ReturnType<D["list"]>
  | ReturnType<D["dictionary"]>;

export class RecursiveVisitor<D extends RecursiveDelegate> extends Visitor {
  constructor(private recursiveDelegate: D) {
    super({
      primitive: (label, position) => this.primitive(label, position),
      list: (label, position) => this.list(label, position),
      dictionary: (label, position) => this.dictionary(label, position)
    });
  }
  primitive(label: Label<PrimitiveLabel>, position: Position): unknown {
    let type = label.type.schemaType;
    let required =
      position === Position.Only || label.optionality === Optionality.Required;

    return this.recursiveDelegate.primitive(type, required);
  }

  list(label: Label<ListLabel>, position: Position): unknown {
    return this.recursiveDelegate.list(
      this.visit(label.type.item, Position.Only) as ItemType<D>,
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

      callback(this.visit(input[key]!, dictPosition) as ItemType<D>, key);
    });
  }
}

export class StringVisitor<Buffer extends Accumulator<Inner>, Inner, Options> {
  private visitor = new Visitor(this);
  constructor(private reporter: Reporter<Buffer, Inner, Options>) {}

  primitive(label: Label<PrimitiveLabel>, position: Position): unknown {
    this.reporter.startPrimitiveValue(position, label.optionality);
    this.reporter.primitiveValue(label);
    this.reporter.endPrimitiveValue(position, label.optionality);
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
