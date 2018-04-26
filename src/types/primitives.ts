import { ValueValidator, builderFor, validators } from "@cross-check/dsl";
import { Option, unknown } from "ts-std";
import { TypeFunction, primitive, type } from "./type";

export const Text: TypeFunction = primitive(validators.isString(), {
  name: "Text",
  typescript: "string"
});

const Num: TypeFunction = primitive(validators.isNumber(), {
  name: "Number",
  typescript: "number"
});

export { Num as Number };

const isInteger = validators.is(
  (value: number): value is number => Number.isInteger(value),
  "number:integer"
);

export const Integer = primitive(validators.isNumber().andThen(isInteger()), {
  name: "Integer",
  typescript: "number",
  description: "integer"
});

const isSingleLine = validators.is(
  (value: string): value is string => !/\n/.test(value),
  "string:single-line"
);

const isSingleWord = validators.is(
  (value: string): value is string => !/\s/.test(value),
  "string:single-word"
);

export const SingleLine: TypeFunction = type(
  validators.isString().andThen(isSingleLine()),
  {
    name: "SingleLine",
    typescript: "string",
    description: "single line string"
  },
  Text()
);

export const SingleWord: TypeFunction = type(
  validators.isString().andThen(isSingleWord()),
  {
    name: "SingleWord",
    typescript: "string",
    description: "single word string"
  },
  Text()
);

class AnyValidator extends ValueValidator<unknown, void> {
  static validatorName = "any";

  validate(_value: unknown, _context: Option<string>): void {
    return;
  }
}

export const Any: TypeFunction = primitive(builderFor(AnyValidator)(), {
  name: "Any",
  typescript: "unknown",
  description: "any"
});
