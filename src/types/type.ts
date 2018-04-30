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

export type Primitive = Interface<PrimitiveImpl>;

export function toPrimitive(
  validation: ValidationBuilder<unknown>,
  typeLabel: TypeLabel
): Primitive {
  return new PrimitiveImpl(validation, {
    type: typeLabel,
    optionality: Optionality.None
  });
}

export class RequiredPrimitive implements Primitive {
  label: Label;

  constructor(private inner: ValidationBuilder<unknown>, typeLabel: TypeLabel) {
    this.label = { type: typeLabel, optionality: Optionality.Required };
  }

  validation(): ValidationBuilder<unknown> {
    return validators.isPresent().andThen(this.inner);
  }
}

export class OptionalPrimitive implements Primitive {
  static forValidation(v: ValidationBuilder<unknown>, typeLabel: TypeLabel) {
    return new OptionalPrimitive(v, typeLabel);
  }

  static forPrimitive(p: Primitive): OptionalPrimitive {
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

  required(): Primitive {
    return new RequiredPrimitive(this.inner, this.innerLabel);
  }
}

export interface AsType {
  asType(): Interface<Type>;
}

export interface AsRequired {
  asRequired(): Interface<Type>;
}

export class Type implements AsType, AsRequired {
  static forPrimitive(p: Primitive): Type {
    return new Type(p, p);
  }

  constructor(public primitiveType: Primitive, public base: Primitive) {}

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

  static forPrimitive(p: Primitive): OptionalType {
    let optional = OptionalPrimitive.forPrimitive(p);
    return new OptionalType(optional, optional);
  }

  static forType(t: Type): OptionalType {
    let derived = OptionalPrimitive.forPrimitive(t.primitiveType);
    let base = OptionalPrimitive.forPrimitive(t.base);

    return new OptionalType(derived, base);
  }

  static derived(primitiveType: Primitive, primitiveBase: Primitive) {
    let derived = OptionalPrimitive.forPrimitive(primitiveType);
    let base = OptionalPrimitive.forPrimitive(primitiveBase);

    return new OptionalType(derived, base);
  }

  constructor(
    private derived: Interface<OptionalPrimitive>,
    private base: Interface<OptionalPrimitive>
  ) {}

  required(): Interface<Type> {
    return new Type(this.derived.required(), this.base);
  }

  asRequired(): Interface<Type> {
    return this.required();
  }

  asType(): Interface<Type> {
    return new Type(this.derived, this.base);
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
    base.asType().primitiveType
  );
  return () => optional;
}
