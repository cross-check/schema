import { Dict, JSON } from "ts-std";
import { Type } from "../fundamental/value";
import { removeUndefined } from "../utils";

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

export type Name = { anonymous: true } | { name: string };

export interface Label<T extends TypeLabel = TypeLabel, N extends Name = Name> {
  type: T;
  templated: boolean;
  name: N;
}

export interface NamedLabel<T extends TypeLabel = TypeLabel> {
  type: T;
  templated: boolean;
  name: { name: string };
}

export interface SchemaType {
  name: string;
  args?: JSON;
}

export interface PrimitiveLabel {
  kind: "primitive";
  // TODO: Can this be unified with something else?
  schemaType: SchemaType;
  description: string;
  typescript: string;
}

export interface ListLabel {
  kind: "list";
  of: Type;
}

export interface DictionaryLabel {
  kind: "dictionary";
  members: Dict<Type>;
}

export interface PointerLabel {
  kind: "pointer";
  schemaType: SchemaType;
  of: Type;
}

export interface IteratorLabel {
  kind: "iterator";
  schemaType: SchemaType;
  of: Type;
}

export type GenericLabel = PointerLabel | IteratorLabel | ListLabel;
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
  description
}: LabelOptions): Label<PrimitiveLabel> {
  return {
    name: ANONYMOUS,
    templated: false,
    type: {
      kind: "primitive",
      schemaType: removeUndefined({ name, args }),
      description: description || typescript,
      typescript
    }
  };
}

export const ANONYMOUS: Name = { anonymous: true };

export function isAnonymous(name: Name): name is { anonymous: true } {
  return "anonymous" in name;
}

export { buildLabel as label };
