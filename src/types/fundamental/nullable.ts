import { Label, optionalLabel, requiredLabel } from "../label";
import { BRAND } from "../utils";
import { Value } from "./value";

export interface Required {
  [BRAND]: "Required";
  label: Label;
}

export interface Optional<Inner extends Value> {
  readonly [BRAND]: "Optional";
  required(): Required & Inner;
}

export class RequiredImpl<Inner extends Value> implements Required {
  readonly [BRAND] = "Required";

  constructor(protected inner: Inner) {}

  get label(): Inner["label"] {
    return requiredLabel(this.inner.label);
  }
}

export abstract class OptionalImpl<Inner extends Value>
  implements Optional<Inner> {
  readonly [BRAND] = "Optional";

  constructor(protected inner: Inner) {}

  get label(): Inner["label"] {
    return optionalLabel(this.inner.label);
  }

  abstract required(): Required & Inner;
}
