import { ErrorPath, ValidationError } from "@cross-check/core";
import { ValidationBuilder, validators } from "@cross-check/dsl";

export function callable<T>(Class: { new (): T }): (() => T) {
  return () => new Class();
}

export type Interface<T> = { [P in keyof T]: T[P] };

export const BRAND = Symbol("BRAND");

export interface Branded<Brand extends string = string> {
  [BRAND]: Brand;
}

/* @internal */
export function isBranded<B extends Branded>(
  value: any,
  brand: B[typeof BRAND]
): value is B {
  return value && typeof value === "object" && value[BRAND] === brand;
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
