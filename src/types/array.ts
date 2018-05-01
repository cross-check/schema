import { ValidationBuilder, validators } from "@cross-check/dsl";
import { unknown } from "ts-std";
import { Label, Optionality } from "./label";
import {
  AsType,
  OptionalType,
  PrimitiveType,
  RequiredType,
  Type,
  TypeImpl
} from "./type";
import { maybe } from "./utils";

const isPresentArray = validators.is(
  (value: unknown[]): value is unknown[] => value.length > 0,
  "present-array"
);

export class PrimitiveArray implements PrimitiveType {
  constructor(private itemType: PrimitiveType) {}

  get label(): Label {
    return {
      type: {
        kind: "list",
        item: this.itemType.label
      },
      optionality: Optionality.None
    };
  }

  validation(): ValidationBuilder<unknown> {
    return validators.array(this.itemType.validation());
  }
}

// These classes exist because the concept of a "required array" is a little
// different from the normal concept of required. Otherwise, we could have
// used the concrete OptionalType directly.
export class RequiredPrimitiveArray implements PrimitiveType {
  constructor(private itemType: PrimitiveType) {}

  get label(): Label {
    return {
      type: {
        kind: "list",
        item: this.itemType.label
      },
      optionality: Optionality.Required
    };
  }

  validation(): ValidationBuilder<unknown> {
    return validators
      .isPresent()
      .andThen(validators.array(this.itemType.validation()))
      .andThen(isPresentArray());
  }
}

export class OptionalPrimitiveArray implements PrimitiveType {
  constructor(private itemType: PrimitiveType) {}

  get label(): Label {
    return {
      type: {
        kind: "list",
        item: this.itemType.label
      },
      optionality: Optionality.Optional
    };
  }

  validation(): ValidationBuilder<unknown> {
    return maybe(validators.array(this.itemType.validation()));
  }
}

export class OptionalArrayType implements OptionalType {
  readonly type = "optional";
  private itemType: Type;

  constructor(item: AsType) {
    this.itemType = item.asType();
  }

  required(): RequiredType {
    return new TypeImpl(
      new RequiredPrimitiveArray(this.itemType.custom),
      new OptionalPrimitiveArray(this.itemType.base)
    );
  }

  asRequired(): RequiredType {
    return this.required();
  }

  asType(): Type {
    return new TypeImpl(
      new OptionalPrimitiveArray(this.itemType.custom),
      new OptionalPrimitiveArray(this.itemType.base)
    );
  }
}

export function List(itemType: AsType): OptionalType {
  return new OptionalArrayType(itemType);
}
