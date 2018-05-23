import { JSON, Option } from "ts-std";
import { IteratorLabel, Label, typeNameOf } from "../label";
import { ReferenceImpl } from "./reference";
import { Type, baseType } from "./value";

export class IteratorImpl extends ReferenceImpl {
  constructor(
    private inner: Type,
    private name: string | undefined,
    private args: JSON | undefined,
    isRequired: boolean,
    base: Option<Type>
  ) {
    super(isRequired, base);
  }

  get label(): Label<IteratorLabel> {
    let inner = this.inner.required();

    return {
      type: {
        kind: "iterator",
        of: inner
      },
      args: this.args,
      description: `hasMany ${typeNameOf(inner.label.name)}`,
      name: "hasMany"
    };
  }

  required(isRequired = true): Type {
    return new IteratorImpl(
      this.inner,
      this.name,
      this.args,
      isRequired,
      this.base
    );
  }

  named(arg: Option<string>): Type {
    return new IteratorImpl(
      this.inner,
      arg === null ? undefined : arg,
      this.args,
      this.isRequired,
      this.base
    );
  }
}

export function hasMany(item: Type, options?: JSON): Type {
  let draftType = new IteratorImpl(
    baseType(item),
    undefined,
    options,
    false,
    null
  );
  return new IteratorImpl(item, undefined, options, false, draftType);
}
