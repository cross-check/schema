import { ValidationBuilder, validators } from "@cross-check/dsl";
import { Option, unknown } from "ts-std";
import { ANONYMOUS, Label } from "../label";
import { maybe } from "../utils";
import { Type, baseType, parse, serialize } from "./value";

const isPresentArray = validators.is(
  (value: unknown[]): value is unknown[] => value.length > 0,
  "present-array"
);

class ArrayImpl implements Type {
  constructor(
    private itemType: Type,
    readonly isRequired: boolean,
    readonly base: Option<Type>
  ) {}

  get label(): Label {
    return {
      type: {
        kind: "list",
        of: this.itemType.required()
      },
      name: ANONYMOUS,
      templated: false
    };
  }

  required(isRequired = true): Type {
    return new ArrayImpl(this.itemType, isRequired, this.base);
  }

  serialize(js: any[]): any {
    let itemType = this.itemType;

    return serialize(js, !this.isRequired, () =>
      js.map(item => itemType.serialize(item))
    );
  }

  parse(wire: any[]): any {
    let itemType = this.itemType;

    return parse(wire, !this.isRequired, () =>
      wire.map(item => itemType.parse(item))
    );
  }

  validation(): ValidationBuilder<unknown> {
    let validator = validators.array(this.itemType.validation());
    if (this.isRequired) {
      return validators
        .isPresent()
        .andThen(validator)
        .andThen(isPresentArray());
    } else {
      return maybe(validator);
    }
  }
}

export function List(item: Type): Type {
  let draftType = new ArrayImpl(baseType(item), false, null);
  return new ArrayImpl(item, false, draftType);
}
