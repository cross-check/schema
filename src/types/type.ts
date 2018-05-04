import {
  DirectValue,
  OptionalDirectValueImpl
} from "./fundamental/direct-value";
import { Optional } from "./fundamental/nullable";
import { Value } from "./fundamental/value";
import {
  OptionalRefinedType,
  RequiredRefinedType,
  Type,
  draftType,
  strictType
} from "./refined";
import { BRAND, isBranded } from "./utils";

/**
 * Internals Vocabulary:
 *
 * Reference:
 *   Represents data that is not directly included in the parent object.
 *   Dereferencing a reference may be asynchronous.
 *
 * Direct Value:
 *   Represent data that is directly included in the parent object.
 *   They include scalars, lists and dictionaries.
 *
 * Scalar (Value):
 *   A single value.
 *
 * List (Value):
 *   A list of values.
 *
 * Dictionary (Value):
 *   A set of key-value pairs. A dictionary's values are Values.A dictionary's keys are strings.
 *
 * Pointer (Reference):
 *   A reference to a value.
 *
 * Iterator (Reference):
 *   A reference to a sequence of values. Each iteration of an iterator may be asynchronous.
 *
 */

export function requiredType<Inner extends Value>(
  primitive: Type<Inner>
): RequiredRefinedType<Inner> {
  if (isBranded<OptionalRefinedType<Inner>>(primitive, "OptionalRefinedType")) {
    return primitive.required();
  } else {
    return primitive as RequiredRefinedType<Inner>;
  }
}

/* @internal */
export function buildRequiredType<Inner extends Value>(
  strict: Inner,
  draft: Inner
): RequiredRefinedType<Inner> {
  return {
    [BRAND]: "RequiredRefinedType",
    strict,
    draft
  };
}

export function buildOptionalValue(
  t: Type<DirectValue>
): OptionalRefinedType<DirectValue> {
  let strict = new OptionalDirectValueImpl(strictType(t));
  let draft = new OptionalDirectValueImpl(draftType(t));

  return buildOptional({ strict, draft });
}

export function buildOptional<Inner extends Value>({
  strict,
  draft
}: {
  strict: Optional<Inner> & Inner;
  draft: Optional<Inner> & Inner;
}): OptionalRefinedType<Inner> {
  return {
    [BRAND]: "OptionalRefinedType",
    required() {
      return buildRequiredType<Inner>(strict.required(), draft);
    },

    strict,
    draft
  };
}

export { buildOptionalValue as optional };

function newValue(p: DirectValue): () => OptionalRefinedType<DirectValue> {
  let optional = buildOptionalValue({
    [BRAND]: "RequiredRefinedType" as "RequiredRefinedType",
    strict: p,
    draft: p
  });

  return () => optional;
}

export { newValue as primitive };

export function customPrimitive(
  strict: DirectValue,
  draft: OptionalRefinedType<DirectValue>
): () => OptionalRefinedType<DirectValue> {
  let optional = buildOptionalValue({
    [BRAND]: "RequiredRefinedType" as "RequiredRefinedType",
    strict,
    draft: draft.required().strict
  });

  return () => optional;
}
