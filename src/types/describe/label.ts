import { Dict, unknown } from "ts-std";
import { Accumulator, Position, Reporter } from "./reporter";

export enum Optionality {
  Required,
  Optional,
  None
}

export interface Label<T extends TypeLabel = TypeLabel> {
  type: T;
  optionality: Optionality;
}

export interface PrimitiveLabel {
  kind: "primitive";
  schemaType: { name: string; args: string[] };
  description: string;
  typescript: string;
}

export interface ListLabel {
  kind: "list";
  item: Label;
}

export interface TupleLabel {
  kind: "tuple";
  items: Label[];
}

export interface DictionaryLabel {
  kind: "dictionary";
  members: Dict<Label>;
}

export type TypeLabel =
  | PrimitiveLabel
  | ListLabel
  | TupleLabel
  | DictionaryLabel;

export abstract class Visitor {
  abstract primitive(label: Label<PrimitiveLabel>, position: Position): unknown;
  abstract list(label: Label<ListLabel>, position: Position): unknown;
  abstract dictionary(
    label: Label<DictionaryLabel>,
    position: Position
  ): unknown;

  visit(label: Label, position: Position = Position.Any): unknown {
    switch (label.type.kind) {
      case "primitive": {
        return this.primitive(label as Label<PrimitiveLabel>, position);
      }

      case "list": {
        return this.list(label as Label<ListLabel>, position);
      }

      case "dictionary": {
        return this.dictionary(label as Label<DictionaryLabel>, position);
      }
    }
  }
}

export class StringVisitor<
  Buffer extends Accumulator<Inner>,
  Inner
> extends Visitor {
  constructor(private reporter: Reporter<Buffer, Inner>) {
    super();
  }

  primitive(label: Label<PrimitiveLabel>, position: Position): unknown {
    this.reporter.startPrimitiveValue(position);
    this.reporter.primitiveValue(label);
    this.reporter.endPrimitiveValue(position);
  }

  list(label: Label<ListLabel>, position: Position): unknown {
    this.reporter.startListValue(position);
    this.visit(label.type.item, Position.Only);
    this.reporter.endListValue(position);
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
      this.visit(members[key]!, itemPosition);
    });

    this.reporter.endDictionary(position, label.optionality);

    return this.reporter.finish();
  }
}
