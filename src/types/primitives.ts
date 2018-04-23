import { ValueValidator, builderFor, validators } from "@cross-check/dsl";
import { Option, unknown } from "ts-std";
import {
  TypeFunction,
  derived,
  primitive,
  primitiveLabel,
  toPrimitive
} from "./type";

export const Text: TypeFunction = primitive(
  validators.isString(),
  primitiveLabel({ name: "Text" }, "string", "string")
);

export const Num: TypeFunction = primitive(
  validators.isNumber(),
  primitiveLabel({ name: "Num" }, "number", "number")
);

const isSingleLine = validators.is(
  (value: string): value is string => !/\n/.test(value),
  "string:single-line"
);

const isSingleWord = validators.is(
  (value: string): value is string => !/\s/.test(value),
  "string:single-word"
);

export const SingleLine: TypeFunction = derived(
  toPrimitive(
    validators.isString().andThen(isSingleLine()),
    primitiveLabel({ name: "SingleLine" }, "single line string", "string")
  ),
  Text()
);

export const SingleWord: TypeFunction = derived(
  toPrimitive(
    validators.isString().andThen(isSingleLine()),
    primitiveLabel({ name: "Single Word" }, "single word string", "string")
  ),
  Text()
);

class AnyValidator extends ValueValidator<unknown, void> {
  validate(_value: unknown, _context: Option<string>): void {
    return;
  }
}

export const Any: TypeFunction = primitive(
  builderFor(AnyValidator)(),
  primitiveLabel({ name: "Any" }, "any", "unknown")
);
