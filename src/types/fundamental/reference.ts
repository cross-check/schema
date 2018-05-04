import { Label, ReferenceLabel, optionalLabel } from "../label";
import { OptionalImpl, Required, RequiredImpl } from "./nullable";

export interface Reference {
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
