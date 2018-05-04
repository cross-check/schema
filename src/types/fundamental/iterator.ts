import {
  IteratorLabel,
  Label,
  Optionality,
  optionalLabel,
  requiredLabel
} from "../label";
import {
  OptionalRefinedType,
  RefinedType,
  RequiredRefinedType
} from "../refined";
import { BRAND } from "../utils";
import { DirectValue } from "./direct-value";
import { Reference } from "./reference";

export interface IteratorType extends Reference {
  readonly label: Label<IteratorLabel>;
}

export class Iterator implements IteratorType {
  [BRAND]: "ReferenceType";

  constructor(private item: RefinedType<DirectValue>) {}

  get label(): Label<IteratorLabel> {
    return {
      type: {
        kind: "iterator",
        schemaType: {
          name: "hasMany",
          args: []
        },
        item: this.item.strict.label
      },
      optionality: Optionality.None
    };
  }
}

// These classes exist because the concept of a "required array" is a little
// different from the normal concept of required. Otherwise, we could have
// used the concrete OptionalType directly.
export class RequiredIterator implements Reference {
  constructor(private inner: IteratorType) {}

  get label(): Label<IteratorLabel> {
    return requiredLabel(this.inner.label);
  }
}

export class OptionalIterator implements IteratorType {
  readonly [BRAND] = "OptionalType";

  constructor(private inner: IteratorType) {}

  get label(): Label<IteratorLabel> {
    return optionalLabel(this.inner.label);
  }

  required(): RequiredIterator {
    return new RequiredIterator(this.inner);
  }
}

export function buildOptional(t: {
  strict: IteratorType;
  draft: IteratorType;
}): OptionalRefinedType<IteratorType> {
  let strict = new OptionalIterator(t.strict);
  let draft = new OptionalIterator(t.draft);

  return {
    [BRAND]: "OptionalRefinedType",

    strict,
    draft,

    required(): RequiredRefinedType<IteratorType> {
      return {
        [BRAND]: "RequiredRefinedType",
        strict: strict.required(),
        draft
      };
    }
  };
}

export function hasMany(
  item: RefinedType<DirectValue>
): OptionalRefinedType<IteratorType> {
  let iterator = new Iterator(item);
  let optional = new OptionalIterator(iterator);
  return buildOptional({ strict: optional, draft: optional });
}
