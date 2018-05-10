import { JSON, Option } from "ts-std";
import { ANONYMOUS, IteratorLabel, Label, SchemaType } from "../label";
import { ReferenceImpl } from "./reference";
import { Type, baseType } from "./value";

export class IteratorImpl extends ReferenceImpl {
  constructor(
    private inner: Type,
    private schemaType: SchemaType,
    isRequired: boolean,
    base: Option<Type>
  ) {
    super(isRequired, base);
  }

  get label(): Label<IteratorLabel> {
    return {
      type: {
        kind: "iterator",
        schemaType: this.schemaType,
        of: this.inner.required()
      },
      name: ANONYMOUS,
      templated: false
    };
  }

  required(isRequired = true): Type {
    return new IteratorImpl(this.inner, this.schemaType, isRequired, this.base);
  }
}

export function hasMany(item: Type, options?: JSON): Type {
  let schemaType = {
    name: "hasMany",
    ...{ args: options }
  };

  let draftType = new IteratorImpl(baseType(item), schemaType, false, null);
  return new IteratorImpl(item, schemaType, false, draftType);
}
