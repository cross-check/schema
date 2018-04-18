import { ValueValidator, builderFor, validators } from "@cross-check/dsl";
import { Option, unknown } from "ts-std";
import {
  TypeFunction,
  derived,
  primitive,
  primitiveLabel,
  toPrimitive
} from "./type";

const isSingleLine = validators.is(
  (value: string): value is string => !/\n/.test(value),
  "string:single-line"
);

export const SingleLine: TypeFunction = derived(
  toPrimitive(
    validators.isString().andThen(isSingleLine()),
    primitiveLabel("single line string", "string")
  ),
  toPrimitive(validators.isString(), primitiveLabel("string", "string"))
);

class AnyValidator extends ValueValidator<unknown, void> {
  validate(_value: unknown, _context: Option<string>): void {
    return;
  }
}

export const Any: TypeFunction = primitive(
  builderFor(AnyValidator)(),
  primitiveLabel("any", "unknown")
);
export const Text: TypeFunction = primitive(
  validators.isString(),
  primitiveLabel("string", "string")
);
export const Num: TypeFunction = primitive(
  validators.isNumber(),
  primitiveLabel("number", "number")
);
