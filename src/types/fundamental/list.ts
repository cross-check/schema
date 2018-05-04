import { ValidationBuilder, validators } from "@cross-check/dsl";
import { unknown } from "ts-std";
import { Label, Optionality } from "../label";
import {
  OptionalRefinedType,
  RequiredRefinedType,
  Type,
  draftType,
  strictType
} from "../refined";
import { buildRequiredType } from "../type";
import { BRAND } from "../utils";
import {
  DirectValue,
  OptionalDirectValueImpl,
  RequiredDirectValueImpl
} from "./direct-value";
import { Optional } from "./nullable";

const isPresentArray = validators.is(
  (value: unknown[]): value is unknown[] => value.length > 0,
  "present-array"
);

export interface PrimitiveArray extends DirectValue {
  readonly label: Label;
  validation(): ValidationBuilder<unknown>;

  serialize(input: any[]): any;
  parse(input: any[]): any;
}

class PrimitiveArrayImpl implements PrimitiveArray {
  [BRAND]: "Primitive";

  constructor(private itemType: DirectValue) {}

  get label(): Label {
    return {
      type: {
        kind: "list",
        item: this.itemType.label
      },
      optionality: Optionality.None
    };
  }

  serialize(js: any[]): any {
    return js.map(item => this.itemType.serialize(item));
  }

  parse(wire: any[]): any {
    return wire.map(item => this.itemType.parse(item));
  }

  validation(): ValidationBuilder<unknown> {
    return validators.array(this.itemType.validation());
  }
}

class PrimitiveArrayType implements OptionalRefinedType<PrimitiveArray> {
  readonly [BRAND] = "OptionalRefinedType";

  readonly strict: Optional<PrimitiveArray> & PrimitiveArray;
  readonly draft: Optional<PrimitiveArray> & PrimitiveArray;

  constructor(private item: Type<PrimitiveArray>) {
    this.strict = new OptionalDirectValueImpl(strictType(item));
    this.draft = new OptionalDirectValueImpl(draftType(item));
  }

  required(): RequiredRefinedType<PrimitiveArray> {
    return buildRequiredType<PrimitiveArray>(
      new RequiredPrimitiveArray(strictType(this.item)),
      this.draft
    );
  }
}

class RequiredPrimitiveArray extends RequiredDirectValueImpl {
  validation(): ValidationBuilder<unknown> {
    return super.validation().andThen(isPresentArray());
  }
}

export function List(
  item: Type<DirectValue>
): OptionalRefinedType<PrimitiveArray> {
  let strict = new PrimitiveArrayImpl(strictType(item));
  let draft = new PrimitiveArrayImpl(draftType(item));

  return new PrimitiveArrayType({
    [BRAND]: "RequiredRefinedType" as "RequiredRefinedType",
    strict,
    draft
  });
}
