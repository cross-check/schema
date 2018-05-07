import { IteratorLabel, Label, Optionality, requiredLabel } from "../label";
import { OptionalRefinedType, Type, strictType } from "../refined";
import { buildOptional } from "../type";
import { BRAND } from "../utils";
import { InlineType } from "./direct-value";
import { OptionalReferenceImpl, Reference } from "./reference";

export interface Iterator extends Reference {
  readonly label: Label<IteratorLabel>;
}

export class IteratorImpl implements Iterator {
  [BRAND]: "Pointer";

  constructor(private inner: Type<InlineType>) {}

  get label(): Label<IteratorLabel> {
    return {
      type: {
        kind: "iterator",
        schemaType: {
          name: "hasMany",
          args: []
        },
        of: requiredLabel(strictType(this.inner).label)
      },
      optionality: Optionality.None
    };
  }
}

export function hasMany(
  entity: Type<InlineType>
): OptionalRefinedType<Reference> {
  let reference = new IteratorImpl(entity);
  let optional = new OptionalReferenceImpl(reference);
  return buildOptional({ strict: optional, draft: optional });
}
