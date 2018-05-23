import { ValidationBuilder, validators } from "@cross-check/dsl";
import { Option, unknown } from "ts-std";
import { Label, NamedLabel, TypeLabel } from "../label";
import { maybe } from "../utils";

export const Pass = Symbol();
export type Pass = typeof Pass;

export interface Type {
  readonly label: Label;
  readonly base: Option<Type>;
  readonly isRequired: boolean;

  required(isRequired?: boolean): Type;
  named(arg: Option<string>): Type;
  validation(): ValidationBuilder<unknown>;
  serialize(input: unknown): unknown | Pass;
  parse(input: unknown): unknown | Pass;
}

export interface LabelledType<L extends TypeLabel = TypeLabel> extends Type {
  readonly label: Label<L>;
}

export interface NamedType<L extends TypeLabel = TypeLabel>
  extends LabelledType<L> {
  label: NamedLabel<L>;
}

export function baseType(type: Type): Type {
  if (type.base === null) {
    return type;
  } else {
    return type.base;
  }
}

export function validationFor(
  builder: ValidationBuilder<unknown>,
  required: boolean
): ValidationBuilder<unknown> {
  if (required) {
    return validators.isPresent().andThen(builder);
  } else {
    return maybe(builder);
  }
}

export function serialize<T, C extends (value: T) => unknown>(
  value: T,
  nullable: boolean,
  serializeValue: C
): ReturnType<C> | null | undefined {
  if (nullable && (value === null || value === undefined)) {
    return null;
  } else {
    return serializeValue(value) as ReturnType<C>;
  }
}

export function parse<T, C extends (value: T) => unknown>(
  value: T,
  nullable: boolean,
  parseValue: C
): ReturnType<C> | null | undefined {
  if (nullable && (value === null || value === undefined)) {
    return null;
  } else {
    return parseValue(value) as ReturnType<C>;
  }
}
