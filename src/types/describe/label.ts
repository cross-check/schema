import { Dict } from "ts-std";

export enum Optionality {
  Required,
  Optional,
  None
}

export interface Label<T extends TypeLabel = TypeLabel> {
  type: T;
  optionality: Optionality;
}

export interface SchemaType {
  name: string;
  args: string[];
}

export interface PrimitiveLabel {
  kind: "primitive";
  schemaType: SchemaType;
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

export interface LabelOptions {
  name: string;
  args?: string[];
  typescript: string;
  description?: string;
  optionality?: Optionality;
}

function buildLabel({
  name,
  args,
  typescript,
  description,
  optionality = Optionality.None
}: LabelOptions): Label<PrimitiveLabel> {
  return {
    optionality,
    type: {
      kind: "primitive",
      schemaType: { name, args: args || [] },
      description: description || typescript,
      typescript
    }
  };
}

export { buildLabel as label };
