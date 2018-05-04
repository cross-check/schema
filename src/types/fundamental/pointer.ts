import { Label, Optionality, PointerLabel } from "../label";
import { OptionalRefinedType, RefinedType } from "../refined";
import { buildOptional } from "../type";
import { DirectValue } from "./direct-value";
import { OptionalReferenceImpl, Reference } from "./reference";

export interface Pointer extends Reference {
  readonly label: Label<PointerLabel>;
}

export class PointerImpl implements Pointer {
  constructor(private inner: RefinedType<DirectValue>) {}

  get label(): Label<PointerLabel> {
    return {
      type: {
        kind: "pointer",
        schemaType: {
          name: "hasOne",
          args: []
        },
        entity: this.inner.strict.label
      },
      optionality: Optionality.None
    };
  }
}

export function hasOne(
  entity: RefinedType<DirectValue>
): OptionalRefinedType<Reference> {
  let reference = new PointerImpl(entity);
  let optional = new OptionalReferenceImpl(reference);
  return buildOptional({ strict: optional, draft: optional });
}
