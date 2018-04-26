import { ErrorMessage } from "@cross-check/core";
import {
  ValidationBuilder,
  ValueValidator,
  builderFor,
  validators
} from "@cross-check/dsl";
import { unknown } from "ts-std";

export class FormatValidator extends ValueValidator<string, RegExp> {
  static validatorName = "format";

  validate(value: string): ErrorMessage | void {
    if (this.options.test(value)) {
      return;
    } else {
      return { name: "format", details: this.options };
    }
  }
}

export const isFormat = builderFor(FormatValidator);

export function format(regex: RegExp): ValidationBuilder<unknown> {
  return validators.isString().andThen(isFormat(regex));
}
