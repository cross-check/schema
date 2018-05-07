import {
  ValidationBuilder,
  ValueValidator,
  builderFor,
  validators
} from "@cross-check/dsl";
import { Option, unknown } from "ts-std";
import { Label, label } from "../describe/label";
import { InlineType } from "../fundamental/direct-value";
import { OptionalRefinedType } from "../refined";
import { customPrimitive, primitive } from "../type";
import { BRAND } from "../utils";

class TextPrimitive implements InlineType {
  [BRAND]: "PrimitiveType";

  get label(): Label {
    return label({
      name: "Text",
      typescript: "string"
    });
  }

  validation(): ValidationBuilder<unknown> {
    return validators.isString();
  }

  serialize(input: string): string {
    return input;
  }

  parse(input: string): string {
    return input;
  }
}

export const Text: () => OptionalRefinedType<InlineType> = primitive(
  new TextPrimitive()
);

class NumberPrimitive implements InlineType {
  [BRAND]: "PrimitiveType";

  get label(): Label {
    return label({
      name: "Number",
      typescript: "number"
    });
  }

  validation(): ValidationBuilder<unknown> {
    return validators.isNumber();
  }

  serialize(input: string): string {
    return input;
  }

  parse(input: string): string {
    return input;
  }
}

const Num: () => OptionalRefinedType<InlineType> = primitive(
  new NumberPrimitive()
);

export { Num as Number };

class IntegerPrimitive implements InlineType {
  [BRAND]: "PrimitiveType";

  get label(): Label {
    return label({
      name: "Integer",
      typescript: "number",
      description: "integer"
    });
  }

  validation(): ValidationBuilder<unknown> {
    return validators
      .isNumber()
      .andThen(
        validators.is(
          (value: number): value is number => Number.isInteger(value),
          "number:integer"
        )()
      );
  }

  serialize(input: number): number {
    return input;
  }

  parse(input: number): number {
    return input;
  }
}

export const Integer: () => OptionalRefinedType<InlineType> = primitive(
  new IntegerPrimitive()
);

class SingleLinePrimitive extends TextPrimitive {
  get label(): Label {
    return label({
      name: "SingleLine",
      typescript: "string",
      description: "single line string"
    });
  }

  validation(): ValidationBuilder<unknown> {
    return super
      .validation()
      .andThen(
        validators.is(
          (value: string): value is string => !/\n/.test(value),
          "string:single-line"
        )()
      );
  }
}

export const SingleLine: () => OptionalRefinedType<
  InlineType
> = customPrimitive(new SingleLinePrimitive(), Text());

class SingleWordPrimitive extends TextPrimitive {
  get label(): Label {
    return label({
      name: "SingleWord",
      description: "single word string",
      typescript: "string"
    });
  }

  validation(): ValidationBuilder<unknown> {
    return super
      .validation()
      .andThen(
        validators.is(
          (value: string): value is string => !/\s/.test(value),
          "string:single-word"
        )()
      );
  }
}

export const SingleWord: () => OptionalRefinedType<
  InlineType
> = customPrimitive(new SingleWordPrimitive(), Text());

class AnyPrimitive implements InlineType {
  [BRAND]: "PrimitiveType";

  get label(): Label {
    return label({
      name: "Any",
      typescript: "unknown",
      description: "any"
    });
  }

  validation(): ValidationBuilder<unknown> {
    return builderFor(AnyValidator)();
  }

  serialize(input: string): string {
    return input;
  }

  parse(input: string): string {
    return input;
  }
}

class AnyValidator extends ValueValidator<unknown, void> {
  static validatorName = "any";

  validate(_value: unknown, _context: Option<string>): void {
    return;
  }
}

export const Any: () => OptionalRefinedType<InlineType> = primitive(
  new AnyPrimitive()
);
