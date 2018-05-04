import { Label, Optionality, PointerLabel } from "../label";
import { OptionalRefinedType, Type, strictType } from "../refined";
import { buildOptional } from "../type";
import { BRAND } from "../utils";
import { DirectValue } from "./direct-value";
import { OptionalReferenceImpl, Reference } from "./reference";

export interface Pointer extends Reference {
  readonly label: Label<PointerLabel>;
}

export class PointerImpl implements Pointer {
  [BRAND]: "Pointer";

  constructor(private inner: Type<DirectValue>) {}

  get label(): Label<PointerLabel> {
    return {
      type: {
        kind: "pointer",
        schemaType: {
          name: "hasOne",
          args: []
        },
        entity: strictType(this.inner).label
      },
      optionality: Optionality.None
    };
  }
}

export function hasOne(
  entity: Type<DirectValue>
): OptionalRefinedType<Reference> {
  let reference = new PointerImpl(entity);
  let optional = new OptionalReferenceImpl(reference);
  return buildOptional({ strict: optional, draft: optional });
}
