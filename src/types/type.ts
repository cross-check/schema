import { ValidationBuilder, validators } from "@cross-check/dsl";
import { JSON, unknown } from "ts-std";
import { Label, Optionality } from "./label";
import { BRAND, isBranded, maybe } from "./utils";

/**
 * @internal
 *
 * A primitive type provides a validation rule and a label.
 *
 * All types, including collection types, are primitive types at their core.
 */
export interface PrimitiveType<JS = unknown, Wire = JSON | undefined> {
  readonly label: Label;
  validation(): ValidationBuilder<unknown>;

  serialize(input: JS): Wire;
  parse(input: Wire): JS;
}

class RequiredPrimitive implements RequiredPrimitiveType {
  readonly [BRAND] = "RequiredPrimitiveType";

  constructor(private inner: PrimitiveType) {}

  get label() {
    return {
      optionality: Optionality.Required,
      type: this.inner.label.type
    };
  }

  serialize(js: any): any {
    return this.inner.serialize(js);
  }

  parse(wire: any): any {
    return this.inner.parse(wire);
  }

  validation(): ValidationBuilder<unknown> {
    // Make sure that we get a presence error first if the inner value is undefined
    return validators.isPresent().andThen(this.inner.validation());
  }
}

export interface RequiredPrimitiveType extends PrimitiveType {
  [BRAND]: "RequiredPrimitiveType";
}

export interface OptionalPrimitiveType extends PrimitiveType {
  readonly [BRAND]: "OptionalPrimitiveType";
  required(): RequiredPrimitiveType;
}

function buildOptionalPrimitive(p: PrimitiveType): OptionalPrimitiveType {
  return new OptionalPrimitive(p);
}

class OptionalPrimitive implements OptionalPrimitiveType {
  readonly [BRAND] = "OptionalPrimitiveType";

  constructor(private inner: PrimitiveType) {}

  get label() {
    return {
      optionality: Optionality.Optional,
      type: this.inner.label.type
    };
  }

  validation(): ValidationBuilder<unknown> {
    return maybe(this.inner.validation());
  }

  serialize(value: any): any {
    if (value === null || value === undefined) {
      return null;
    } else {
      return this.inner.serialize(value);
    }
  }

  parse(wire: any): any {
    if (wire === null || wire === undefined) {
      return null;
    } else {
      return this.inner.parse(wire);
    }
  }

  required(): RequiredPrimitiveType {
    return new RequiredPrimitive(this.inner);
  }
}

export function required(primitive: AnyType): RequiredType {
  if (isBranded<OptionalType>(primitive, "OptionalType")) {
    return primitive.required();
  } else {
    return primitive;
  }
}

/* @internal */
export interface Type {
  [BRAND]: "Type";

  custom: PrimitiveType;
  base: PrimitiveType;
}

export interface RequiredType {
  [BRAND]: "RequiredType";

  /* @internal */
  asType(): Type;
}

export interface OptionalType {
  [BRAND]: "OptionalType";
  required(): RequiredType;

  /* @internal */
  asType(): Type;
}

export type AnyType = RequiredType | OptionalType;

/* @internal */
export function buildRequiredType(
  custom: PrimitiveType,
  base: PrimitiveType
): RequiredType {
  return {
    [BRAND]: "RequiredType",
    asType: () => asType(custom, base)
  };
}

/* @internal */
export function asType(custom: PrimitiveType, base: PrimitiveType): Type {
  return {
    [BRAND]: "Type",
    custom,
    base
  };
}

export function buildOptional(t: {
  custom: PrimitiveType;
  base: PrimitiveType;
}): OptionalType {
  let custom = buildOptionalPrimitive(t.custom);
  let base = buildOptionalPrimitive(t.base);

  return {
    [BRAND]: "OptionalType",
    required(): RequiredType {
      return buildRequiredType(custom.required(), base);
    },

    asType(): Type {
      return asType(custom, base);
    }
  };
}

export { buildOptional as optional };

function newPrimitive(p: PrimitiveType): () => OptionalType {
  let optional = buildOptional({ custom: p, base: p });

  return () => optional;
}

export { newPrimitive as primitive };

export function type(
  custom: PrimitiveType,
  baseType: OptionalType
): () => OptionalType {
  let optional = buildOptional({
    custom,
    base: baseType.required().asType().custom
  });
  return () => optional;
}
