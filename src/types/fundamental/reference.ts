import { Label, ReferenceLabel, optionalLabel } from "../label";
import { BRAND } from "../utils";
import { OptionalImpl, Required, RequiredImpl } from "./nullable";

export interface Reference {
  [BRAND]: any;
  readonly label: Label<ReferenceLabel>;
}

export class OptionalReferenceImpl extends OptionalImpl<Reference> {
  get label(): Label<ReferenceLabel> {
    return optionalLabel(this.inner.label);
  }

  required(): Required & Reference {
    return new RequiredImpl(this.inner);
  }
}
