import { ValidationBuilder } from "@cross-check/dsl";
import { Option, unknown } from "ts-std";
import { ANONYMOUS, Label, PointerLabel } from "../label";
import { ANY } from "../std/scalars";
import { ReferenceImpl } from "./reference";
import { Type, baseType } from "./value";

export class PointerImpl extends ReferenceImpl {
  constructor(
    private inner: Type,
    readonly isRequired: boolean,
    readonly base: Option<Type>
  ) {
    super(isRequired, base);
  }

  get label(): Label<PointerLabel> {
    return {
      type: {
        kind: "pointer",
        schemaType: {
          name: "hasOne"
        },
        of: this.inner
      },
      name: ANONYMOUS,
      templated: false
    };
  }

  required(isRequired = true): Type {
    return new PointerImpl(this.inner, isRequired, this.base);
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
  let base = new PointerImpl(baseType(entity).required(), false, null);
  return new PointerImpl(entity.required(), false, base);
}
