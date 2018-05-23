import { Dict, JSON } from "ts-std";
import { LabelledType, Type } from "../fundamental/value";

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

  // The name of the type constructor
  name?: string;

  // Any arguments to the type constructor
  args?: JSON;

  // A registered name for the type, which includes
  // arguments to the type constructor. The registered
  // name is optional, and is preferred in formatting
  // if it exists.
  registeredName?: string;

  // A human-readable description of the type
  description: string;
}

export interface NamedLabel<T extends TypeLabel = TypeLabel> extends Label<T> {
  name: string;
}

export function typeNameOf(name: string | undefined): string {
  return name || "";
}

export function typeDescription(type: Type): string {
  return type.label.name || "anonymous";
}

export function template({ type }: Label, name: string): Label {
  return {
    type,
    name,
    description: name,
    args: null
  };
}

export interface NamedLabel<T extends TypeLabel = TypeLabel> extends Label<T> {
  type: T;
  templated: boolean;
  name: string;
  args?: JSON;
}

export interface PrimitiveLabel {
  kind: "primitive";
  description: string;
  typescript: string;
}

export function isPrimitive(type: Type): type is LabelledType<PrimitiveLabel> {
  return type.label.type.kind === "primitive";
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
  of: Type;
}

export interface IteratorLabel {
  kind: "iterator";
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
  registeredName?: string;
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
    name,
    description: description || "anonymous",
    args,
    type: {
      kind: "primitive",
      description: description || typescript,
      typescript
    }
  };
}

export { buildLabel as label };
