import { Value } from "./fundamental/value";
import { BRAND } from "./utils";

/* @internal */
export interface RefinedType<Inner extends Value = Value> {
  [BRAND]: "RequiredRefinedType" | "OptionalRefinedType";
  strict: Inner;
  draft: Inner;
}

export interface RequiredRefinedType<Inner extends Value>
  extends RefinedType<Inner> {
  [BRAND]: "RequiredRefinedType";
}

export interface OptionalRefinedType<Inner extends Value>
  extends RefinedType<Inner> {
  [BRAND]: "OptionalRefinedType";
  required(): RequiredRefinedType<Inner>;
}
