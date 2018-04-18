import { Dict, entries } from "ts-std";
import { Reporter } from "./reporter";

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

  visit(label: Label): void {
    switch (label.type.kind) {
      case "primitive": {
        this.reporter.primitiveValue(label);
        break;
      }

      case "list": {
        this.reporter.startListValue();
        this.visit(label.type.item);
        this.reporter.endListValue();
        break;
      }

      case "dictionary": {
        this.dictionary(label.type);
        break;
      }
    }
  }

  dictionary(dictionary: DictionaryLabel): string {
    this.reporter.startDictionary();

    for (let [key, value] of entries(dictionary.members)) {
      this.reporter.addKey(key, value!.optionality);
      this.visit(value!);
    }

    this.reporter.endDictionary();

    return this.reporter.finish();
  }
}
