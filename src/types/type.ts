import { ValidationBuilder, validators } from "@cross-check/dsl";
import { unknown } from "ts-std";
import { Label, LabelOptions, Optionality, TypeLabel, label } from "./label";
import { Interface, maybe } from "./utils";

export class PrimitiveImpl {
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

class RequiredPrimitive implements PrimitiveType {
  label: Label;

  constructor(private inner: ValidationBuilder<unknown>, typeLabel: TypeLabel) {
    this.label = { type: typeLabel, optionality: Optionality.Required };
  }

  validation(): ValidationBuilder<unknown> {
    return validators.isPresent().andThen(this.inner);
  }
}

export interface OptionalPrimitiveType extends PrimitiveType {
  required(): PrimitiveType;
}

class OptionalPrimitive implements PrimitiveType {
  static forValidation(v: ValidationBuilder<unknown>, typeLabel: TypeLabel) {
    return new OptionalPrimitive(v, typeLabel);
  }

  static forPrimitive(p: PrimitiveType): OptionalPrimitive {
    return new OptionalPrimitive(p.validation(), p.label.type);
  }

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

  required(): PrimitiveType {
    return new RequiredPrimitive(this.inner, this.innerLabel);
  }
}

export interface AsType {
  asType(): Type;
}

export interface AsRequired {
  asRequired(): Type;
}

export interface Type {
  custom: PrimitiveType;
  base: PrimitiveType;

  asType(): Type;
  asRequired(): Type;
}

export class TypeImpl implements AsType, AsRequired {
  static forPrimitive(p: PrimitiveType): Type {
    return new TypeImpl(p, p);
  }

  constructor(public custom: PrimitiveType, public base: PrimitiveType) {}

  asType(): Type {
    return this;
  }

  asRequired(): Type {
    return this;
  }
}

export class OptionalType implements AsType, AsRequired {
  static primitive(
    v: ValidationBuilder<unknown>,
    typeLabel: TypeLabel
  ): OptionalType {
    let p = OptionalPrimitive.forValidation(v, typeLabel);
    return new OptionalType(p, p);
  }

  static forPrimitive(p: PrimitiveType): OptionalType {
    let optional = OptionalPrimitive.forPrimitive(p);
    return new OptionalType(optional, optional);
  }

  static forType(t: Type): OptionalType {
    let derived = OptionalPrimitive.forPrimitive(t.custom);
    let base = OptionalPrimitive.forPrimitive(t.base);

    return new OptionalType(derived, base);
  }

  static derived(primitiveType: PrimitiveType, primitiveBase: PrimitiveType) {
    let derived = OptionalPrimitive.forPrimitive(primitiveType);
    let base = OptionalPrimitive.forPrimitive(primitiveBase);

    return new OptionalType(derived, base);
  }

  constructor(
    private derived: OptionalPrimitiveType,
    private base: OptionalPrimitiveType
  ) {}

  required(): Type {
    return new TypeImpl(this.derived.required(), this.base);
  }

  asRequired(): Type {
    return this.required();
  }

  asType(): Type {
    return new TypeImpl(this.derived, this.base);
  }
}

export function primitive(
  v: ValidationBuilder<unknown>,
  desc: LabelOptions
): TypeFunction {
  let optional = OptionalType.primitive(v, label(desc));
  return () => optional;
}

export type TypeFunction = () => Interface<OptionalType>;

export function type(
  v: ValidationBuilder<unknown>,
  desc: LabelOptions,
  base: Interface<OptionalType>
): () => Interface<OptionalType> {
  let optional = OptionalType.derived(
    toPrimitive(v, label(desc)),
    base.asType().custom
  );
  return () => optional;
}
