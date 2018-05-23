import { ValidationBuilder } from "@cross-check/dsl";
import { Option, unknown } from "ts-std";
import { Label, PointerLabel, typeNameOf } from "../label";
import { ANY } from "../std/scalars";
import { ReferenceImpl } from "./reference";
import { Type, baseType } from "./value";

export class PointerImpl extends ReferenceImpl {
  constructor(
    private inner: Type,
    isRequired: boolean,
    readonly base: Option<Type>,
    private name: string | undefined
  ) {
    super(isRequired, base);
  }

  get label(): Label<PointerLabel> {
    return {
      type: {
        kind: "pointer",
        of: this.inner
      },
      name: "hasOne",
      description: `has one ${typeNameOf(this.inner.label.name)}`
    };
  }

  required(isRequired = true): Type {
    return new PointerImpl(this.inner, isRequired, this.base, this.name);
  }

  named(arg: Option<string>): Type {
    return new PointerImpl(
      this.inner,
      this.isRequired,
      this.base,
      arg === null ? undefined : arg
    );
  }

  validation(): ValidationBuilder<unknown> {
    return ANY;
  }

  serialize(): undefined {
    return;
  }

  parse(): undefined {
    return;
  }
}

export function hasOne(entity: Type): Type {
  let base = new PointerImpl(
    baseType(entity).required(),
    false,
    null,
    undefined
  );
  return new PointerImpl(entity.required(), false, base, undefined);
}
