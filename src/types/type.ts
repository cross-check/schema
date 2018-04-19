import { ValidationBuilder, validators } from "@cross-check/dsl";
import { unknown } from "ts-std";
import { Label, Optionality, TypeLabel } from "./label";
import { Interface, maybe } from "./utils";

export function primitiveLabel(
  { name, args = [] }: { name: string; args?: string[] },
  description: string,
  typescript: string
): TypeLabel {
  return {
    kind: "primitive",
    schemaType: { name, args },
    description,
    typescript
  };
}

export class PrimitiveImpl {
  constructor(
    private inner: ValidationBuilder<unknown>,
    readonly label: Label
  ) {}

  validation(): ValidationBuilder<unknown> {
    return this.inner;
  }
}

export type Primitive = Interface<PrimitiveImpl>;

export function toPrimitive(
  validation: ValidationBuilder<unknown>,
  label: TypeLabel
): Primitive {
  return new PrimitiveImpl(validation, {
    type: label,
    optionality: Optionality.None
  });
}

export class RequiredPrimitive implements Primitive {
  label: Label;

  constructor(private inner: ValidationBuilder<unknown>, label: TypeLabel) {
    this.label = { type: label, optionality: Optionality.Required };
  }

  validation(): ValidationBuilder<unknown> {
    return validators.isPresent().andThen(this.inner);
  }
}

export class OptionalPrimitive implements Primitive {
  static forValidation(v: ValidationBuilder<unknown>, label: TypeLabel) {
    return new OptionalPrimitive(v, label);
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

  constructor(public type: Primitive, public base: Primitive) {}

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
    label: TypeLabel
  ): OptionalType {
    let p = OptionalPrimitive.forValidation(v, label);
    return new OptionalType(p, p);
  }

  static forPrimitive(p: Primitive): OptionalType {
    let optional = OptionalPrimitive.forPrimitive(p);
    return new OptionalType(optional, optional);
  }

  static forType(t: Type): OptionalType {
    let type = OptionalPrimitive.forPrimitive(t.type);
    let base = OptionalPrimitive.forPrimitive(t.base);

    return new OptionalType(type, base);
  }

  static derived(primitiveType: Primitive, primitiveBase: Primitive) {
    let type = OptionalPrimitive.forPrimitive(primitiveType);
    let base = OptionalPrimitive.forPrimitive(primitiveBase);

    return new OptionalType(type, base);
  }

  constructor(
    private type: Interface<OptionalPrimitive>,
    private base: Interface<OptionalPrimitive>
  ) {}

  required(): Interface<Type> {
    return new Type(this.type.required(), this.base);
  }

  asRequired(): Interface<Type> {
    return this.required();
  }

  asType(): Interface<Type> {
    return new Type(this.type, this.base);
  }
}

export function primitive(
  v: ValidationBuilder<unknown>,
  desc: TypeLabel
): TypeFunction {
  let optional = OptionalType.primitive(v, desc);
  return () => optional;
}

export type TypeFunction = () => Interface<OptionalType>;

export function derived(
  type: Primitive,
  base: Interface<OptionalType>
): () => Interface<OptionalType> {
  let optional = OptionalType.derived(type, base.asType().type);
  return () => optional;
}
