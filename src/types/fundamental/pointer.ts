import { Label, Optionality, PointerLabel, requiredLabel } from "../label";
import { OptionalRefinedType, Type, strictType } from "../refined";
import { buildOptional } from "../type";
import { BRAND } from "../utils";
import { InlineType } from "./direct-value";
import { OptionalImpl, Required } from "./nullable";
import { Reference } from "./reference";

export interface Pointer extends Reference {
  readonly label: Label<PointerLabel>;
}

export class PointerImpl implements Pointer {
  [BRAND]: "Pointer";

  constructor(private inner: Type<InlineType>) {}

  get label(): Label<PointerLabel> {
    return {
      type: {
        kind: "pointer",
        schemaType: {
          name: "hasOne",
          args: []
        },
        of: strictType(this.inner).label
      },
      optionality: Optionality.None
    };
  }
}

export class RequiredPointerImpl implements Pointer, Required {
  [BRAND]: "Required";

  constructor(private inner: Pointer) {}

  get label(): Label<PointerLabel> {
    let type = this.inner.label.type;
    let of = this.inner.label.type.of;

    return {
      type: {
        ...type,
        of: requiredLabel(of)
      },
      optionality: Optionality.Required
    };
  }
}

export class OptionalPointerImpl extends OptionalImpl<Pointer> {
  required(): Required & Pointer {
    return new RequiredPointerImpl(this.inner);
  }
}

export function hasOne(
  entity: Type<InlineType>
): OptionalRefinedType<Reference> {
  let reference = new PointerImpl(entity);
  let optional = new OptionalPointerImpl(reference);
  return buildOptional({ strict: optional, draft: optional });
}
