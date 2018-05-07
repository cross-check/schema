import {
  InlineType,
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
 * Reference Type:
 *   Represents data that is not directly included in the parent object.
 *   Dereferencing a reference may be asynchronous.
 *
 * Inline Type:
 *   Represent data that is directly included in the parent object.
 *   They include scalars, lists and dictionaries.
 *
 * Value:
 *   A value of any type (reference or inline).
 *
 * Scalar (Inline):
 *   A single inline value.
 *
 * List (Inline):
 *   A list of inline values.
 *
 * Dictionary (Inline):
 *   A set of key-value pairs. A dictionary's values are inline value. A dictionary's keys are strings.
 *
 * Pointer (Reference):
 *   A reference to another value.
 *
 * Iterator (Reference):
 *   A reference to a sequence of values. Each iteration of an iterator may be asynchronous.
 *
 * Refined Type:
 *   A type that has a strict component and a draft component. Component must either both be inline
 *   or both be references. A type's draft component corresponds to distinctions in underlying
 *   storage and user interface elements, and is intended to make it possible to auto-save
 *   in-progress work in a user interface.s
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
  t: Type<InlineType>
): OptionalRefinedType<InlineType> {
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

function newValue(p: InlineType): () => OptionalRefinedType<InlineType> {
  let optional = buildOptionalValue({
    [BRAND]: "RequiredRefinedType" as "RequiredRefinedType",
    strict: p,
    draft: p
  });

  return () => optional;
}

export { newValue as primitive };

export function customPrimitive(
  strict: InlineType,
  draft: OptionalRefinedType<InlineType>
): () => OptionalRefinedType<InlineType> {
  let optional = buildOptionalValue({
    [BRAND]: "RequiredRefinedType" as "RequiredRefinedType",
    strict,
    draft: draft.required().strict
  });

  return () => optional;
}
