import { ValidationBuilder, validators } from "@cross-check/dsl";
import {
  Label,
  OptionalType,
  PrimitiveType,
  label,
  primitive
} from "@cross-check/schema";
import { unknown } from "ts-std";

function isValidDate(input: string): boolean {
  let parsed = Date.parse(input);
  if (isNaN(parsed)) return false;
  return input === new Date(parsed).toISOString();
}

class DatePrimitive implements PrimitiveType {
  get label(): Label {
    return label({
      name: "ISODate",
      description: "ISO Date",
      typescript: "Date"
    });
  }

  validation(): ValidationBuilder<unknown> {
    return validators.is(
      (v: string): v is string => isValidDate(v),
      "iso-date"
    )();
  }

  serialize(input: Date): string {
    return input.toISOString();
  }

  parse(input: string): Date {
    return new Date(Date.parse(input));
  }
}

export const ISODate: () => OptionalType = primitive(new DatePrimitive());
