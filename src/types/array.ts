import { ValidationBuilder, validators } from "@cross-check/dsl";
import { unknown } from "ts-std";
import { Label, Optionality } from "./label";
import { AsType, OptionalType, Primitive, Type } from "./type";
import { Interface, maybe } from "./utils";

const isPresentArray = validators.is(
  (value: unknown[]): value is unknown[] => value.length > 0,
  "present-array"
);

export class PrimitiveArray implements Primitive {
  constructor(private itemType: Primitive) {}

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
export class RequiredPrimitiveArray implements Primitive {
  constructor(private itemType: Primitive) {}

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

export class OptionalPrimitiveArray implements Primitive {
  constructor(private itemType: Primitive) {}

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

export class OptionalArrayType implements Interface<OptionalType> {
  private itemType: Type;

  constructor(item: AsType) {
    this.itemType = item.asType();
  }

  required(): Interface<Type> {
    return new Type(
      new RequiredPrimitiveArray(this.itemType.type),
      new OptionalPrimitiveArray(this.itemType.base)
    );
  }

  asRequired(): Interface<Type> {
    return this.required();
  }

  asType(): Interface<Type> {
    return new Type(
      new OptionalPrimitiveArray(this.itemType.type),
      new OptionalPrimitiveArray(this.itemType.base)
    );
  }
}

export function List(itemType: AsType): Interface<OptionalType> {
  return new OptionalArrayType(itemType);
}
