import { Dict } from "ts-std";
import { Position, Reporter } from "./reporter";

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

export class Visitor {
  constructor(private reporter: Reporter) {}

  visit(label: Label, position: Position): void {
    switch (label.type.kind) {
      case "primitive": {
        this.reporter.startPrimitiveValue(position);
        this.reporter.primitiveValue(label);
        this.reporter.endPrimitiveValue(position);
        break;
      }

      case "list": {
        this.reporter.startListValue(position);
        this.visit(label.type.item, Position.Only);
        this.reporter.endListValue(position);
        break;
      }

      case "dictionary": {
        this.dictionary(label as Label<DictionaryLabel>, position);
        break;
      }
    }
  }

  dictionary(label: Label<DictionaryLabel>, position: Position): string {
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
