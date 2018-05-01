import { ValidationBuilder, validators } from "@cross-check/dsl";
import { unknown } from "ts-std";
import { Label, LabelOptions, Optionality, TypeLabel, label } from "./label";
import { maybe } from "./utils";

/**
 * @internal
 */
export class PrimitiveImpl {
  readonly type = "required";
  readonly label: Label;

  constructor(
    private inner: ValidationBuilder<unknown>,
    primitiveLabel: Label
  ) {
    this.label = primitiveLabel;
  }

  validation(): ValidationBuilder<unknown> {
    return this.inner;
  }
}

/**
 * A primitive type provides a validation rule and a label.
 *
 * All types, including collection types, are primitive types at their core.
 */
export interface PrimitiveType {
  readonly label: Label;
  validation(): ValidationBuilder<unknown>;
}

function toPrimitive(
  validation: ValidationBuilder<unknown>,
  typeLabel: TypeLabel
): PrimitiveType {
  return new PrimitiveImpl(validation, {
    type: typeLabel,
    optionality: Optionality.None
  });
}

class RequiredPrimitive implements RequiredPrimitiveType {
  readonly type = "required";
  label: Label;

  constructor(private inner: ValidationBuilder<unknown>, typeLabel: TypeLabel) {
    this.label = { type: typeLabel, optionality: Optionality.Required };
  }

  validation(): ValidationBuilder<unknown> {
    // Make sure that we get a presence error first if the inner value is undefined
    return validators.isPresent().andThen(this.inner);
  }
}

export interface RequiredPrimitiveType extends PrimitiveType {
  type: "required";
}

export interface OptionalPrimitiveType extends PrimitiveType {
  readonly type: "optional";
  required(): RequiredPrimitiveType;
}

class OptionalPrimitive implements OptionalPrimitiveType {
  static forValidation(v: ValidationBuilder<unknown>, typeLabel: TypeLabel) {
    return new OptionalPrimitive(v, typeLabel);
  }

  static forPrimitive(p: PrimitiveType): OptionalPrimitive {
    return new OptionalPrimitive(p.validation(), p.label.type);
  }

  readonly type = "optional";
  label: Label;

  constructor(
    private inner: ValidationBuilder<unknown>,
    private innerLabel: TypeLabel
  ) {
    this.label = {
      type: innerLabel,
      optionality: Optionality.Optional
    };
  }

  validation(): ValidationBuilder<unknown> {
    return maybe(this.inner);
  }

  required(): RequiredPrimitiveType {
    return new RequiredPrimitive(this.inner, this.innerLabel);
  }
}

export interface AsType {
  asType(): Type;
}

export function required(primitive: AnyType): RequiredType {
  if (primitive.type === "optional") {
    return primitive.required();
  } else {
    return primitive;
  }
}

export interface Type {
  custom: PrimitiveType;
  base: PrimitiveType;

  asType(): Type;
}

export interface RequiredType {
  type: "required";
  custom: PrimitiveType;
  base: PrimitiveType;

  asType(): Type;
}

export interface OptionalType {
  type: "optional";

  asType(): Type;
  required(): RequiredType;
}

export type AnyType = RequiredType | OptionalType;

/* @internal */
export class TypeImpl implements AsType, RequiredType {
  static forPrimitive(p: PrimitiveType): Type {
    return new TypeImpl(p, p);
  }

  readonly type = "required";

  constructor(public custom: PrimitiveType, public base: PrimitiveType) {}

  asType(): Type {
    return this;
  }
}

export function buildOptional(t: Type): OptionalType {
  let derived = OptionalPrimitive.forPrimitive(t.custom);
  let base = OptionalPrimitive.forPrimitive(t.base);

  return new OptionalTypeImpl(derived, base);
}

export { buildOptional as optional };

class OptionalTypeImpl implements AsType, OptionalType {
  static forPrimitive(p: PrimitiveType): OptionalTypeImpl {
    let optional = OptionalPrimitive.forPrimitive(p);
    return new OptionalTypeImpl(optional, optional);
  }

  readonly type = "optional";

  constructor(
    private custom: OptionalPrimitiveType,
    private base: OptionalPrimitiveType
  ) {}

  required(): RequiredType {
    return new TypeImpl(this.custom.required(), this.base);
  }

  asType(): Type {
    return new TypeImpl(this.custom, this.base);
  }
}

function buildPrimitive(
  v: ValidationBuilder<unknown>,
  desc: LabelOptions
): () => OptionalType {
  let p = OptionalPrimitive.forValidation(v, label(desc));
  let optional = new OptionalTypeImpl(p, p);

  return () => optional;
}

export { buildPrimitive as primitive };

export function type(
  v: ValidationBuilder<unknown>,
  desc: LabelOptions,
  baseType: OptionalType
): () => OptionalType {
  let custom = OptionalPrimitive.forPrimitive(toPrimitive(v, label(desc)));
  let base = OptionalPrimitive.forPrimitive(baseType.asType().custom);

  let optional = new OptionalTypeImpl(custom, base);
  return () => optional;
}
