import { Dict } from "ts-std";

export enum Optionality {
  Required,
  Optional,
  None
}

export function optionalLabel<T extends Label>(label: T): T {
  return {
    ...(label as any),
    optionality: Optionality.Optional
  };
}

export function requiredLabel<T extends Label>(label: T): T {
  return {
    ...(label as any),
    optionality: Optionality.Required
  };
}

export interface Label<T extends TypeLabel = TypeLabel> {
  type: T;
  name?: string;
  optionality: Optionality;
}

export interface NamedLabel<T extends TypeLabel = TypeLabel> {
  type: T;
  name: string;
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

export interface DictionaryLabel {
  kind: "dictionary";
  members: Dict<Label>;
}

export interface PointerLabel {
  kind: "pointer";
  schemaType: SchemaType;
  entity: Label;
}

export interface IteratorLabel {
  kind: "iterator";
  schemaType: SchemaType;
  item: Label;
}

export type ReferenceLabel = PointerLabel | IteratorLabel;

export type TypeLabel =
  | PrimitiveLabel
  | ListLabel
  | DictionaryLabel
  | PointerLabel
  | IteratorLabel;

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
