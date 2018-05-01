import { ValidationBuilder, validators } from "@cross-check/dsl";
import { unknown } from "ts-std";
import { Label, Optionality } from "./label";
import {
  AnyType,
  OptionalType,
  PrimitiveType,
  RequiredType,
  Type,
  asType,
  buildRequiredType
} from "./type";
import { BRAND, maybe } from "./utils";

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

  serialize(js: any[]): any {
    return js.map(item => this.itemType.serialize(item));
  }

  parse(wire: any[]): any {
    return wire.map(item => this.itemType.parse(item));
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

  serialize(js: any[]): any {
    return js.map(item => this.itemType.serialize(item));
  }

  parse(wire: any[]): any {
    return wire.map(item => this.itemType.parse(item));
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

  serialize(js: any[] | null | undefined): any {
    if (js === null || js === undefined) return null;
    return js.map(item => this.itemType.serialize(item));
  }

  parse(wire: any[] | null | undefined): any {
    if (wire === null || wire === undefined) return null;
    return wire.map(item => this.itemType.parse(item));
  }

  validation(): ValidationBuilder<unknown> {
    return maybe(validators.array(this.itemType.validation()));
  }
}

export class OptionalArrayType implements OptionalType {
  readonly [BRAND] = "OptionalType";
  private itemType: Type;

  constructor(item: AnyType) {
    this.itemType = item.asType();
  }

  required(): RequiredType {
    return buildRequiredType(
      new RequiredPrimitiveArray(this.itemType.custom),
      new OptionalPrimitiveArray(this.itemType.base)
    );
  }

  asRequired(): RequiredType {
    return this.required();
  }

  asType(): Type {
    return asType(
      new OptionalPrimitiveArray(this.itemType.custom),
      new OptionalPrimitiveArray(this.itemType.base)
    );
  }
}

export function List(itemType: AnyType): OptionalType {
  return new OptionalArrayType(itemType);
}
