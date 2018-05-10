import { ErrorPath, ValidationError } from "@cross-check/core";
import { ValidationBuilder, validators } from "@cross-check/dsl";
import { Dict, entries } from "ts-std";

export function callable<T>(Class: { new (): T }): (() => T) {
  return () => new Class();
}

export type Interface<T> = { [P in keyof T]: T[P] };

export const OPTIONALITY: unique symbol = Symbol("OPTIONALITY");
export type OPTIONALITY = typeof OPTIONALITY;
export const TYPE_FAMILY: unique symbol = Symbol("TYPE_FAMILY");
export type TYPE_FAMILY = typeof TYPE_FAMILY;

export const OPTIONAL: "OPTIONAL" = "OPTIONAL";
export type OPTIONAL = "OPTIONAL";
export const REQUIRED: "REQUIRED" = "REQUIRED";
export type REQUIRED = "REQUIRED";

/* @internal */
export function isBranded<Type>(
  value: any,
  brand: keyof Type & symbol,
  expected: string
): value is Type {
  return value && typeof value === "object" && value[brand] === expected;
}

export interface Multiple {
  message: {
    name: "multiple";
    details: ValidationError[][];
  };
  path: ErrorPath;
}

function isMultiple(error: ValidationError): error is Multiple {
  return error.message.name === "multiple";
}

export function maybe<T>(validator: ValidationBuilder<T>) {
  return validators
    .isAbsent()
    .or(validator)
    .catch(errors => {
      let first = errors[0];
      if (isMultiple(first)) {
        let suberrors = first.message.details;

        if (suberrors.length === 2) {
          return suberrors[1];
        }
      }

      return errors;
    });
}

export type Defined<T extends Dict> = {
  [P in keyof T]: T[P] extends (undefined | void | never) ? never : T[P]
};

export function removeUndefined<T extends Dict>(input: T): Defined<T> {
  let out = {} as Dict;

  for (let [key, value] of entries(input)) {
    if (value !== undefined) {
      out[key] = value;
    }
  }

  return out as Defined<T>;
}

export function titleize(s: string): string {
  return `${s[0].toUpperCase()}${s.slice(1)}`;
}
