import { Value } from "./fundamental/value";
import { BRAND, Branded, isBranded } from "./utils";

/* @internal */
export interface RefinedType<Inner extends Value = Value> {
  [BRAND]: "OptionalRefinedType" | "RequiredRefinedType";
  strict: Inner;
  draft: Inner;
}

export function isRefinedType(t: Branded): t is RefinedType {
  return (
    isBranded(t, "OptionalRefinedType") || isBranded(t, "RequiredRefinedType")
  );
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

export type Type<V extends Value = Value> = RefinedType<V> | V;

export function strictType<V extends Value>(t: Type<V>): V {
  if (isRefinedType(t)) {
    return t.strict;
  } else {
    return t;
  }
}

export function draftType<V extends Value>(t: Type<V>): V {
  if (isRefinedType(t)) {
    return t.draft;
  } else {
    return t;
  }
}
