import { ValidationBuilder, validators } from "@cross-check/dsl";
import { Label, Scalar, Type, basic, label } from "@cross-check/schema";
import { unknown } from "ts-std";

function isValidDate(input: string): boolean {
  let parsed = Date.parse(input);
  if (isNaN(parsed)) return false;
  return input === new Date(parsed).toISOString();
}

class DateType extends Scalar {
  get label(): Label {
    return label({
      name: "ISODate",
      description: "ISO Date",
      typescript: "Date"
    });
  }

  baseValidation(): ValidationBuilder<unknown> {
    return validators.is((v: string): v is string => {
      return isValidDate(v);
    }, "iso-date")();
  }

  baseSerialize(input: Date): string {
    return input.toISOString();
  }

  baseParse(input: string): Date {
    return new Date(Date.parse(input));
  }
}

export const ISODate: () => Type = basic(DateType);
