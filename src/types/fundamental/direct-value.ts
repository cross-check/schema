import { ValidationBuilder, validators } from "@cross-check/dsl";
import { JSON, unknown } from "ts-std";
import { Label } from "../label";
import { BRAND, maybe } from "../utils";
import { OptionalImpl, Required, RequiredImpl } from "./nullable";

export interface InlineType<JS = unknown, Wire = JSON | undefined> {
  [BRAND]: any;

  readonly label: Label;
  validation(): ValidationBuilder<unknown>;

  serialize(input: JS): Wire;
  parse(input: Wire): JS;
}

export class RequiredDirectValueImpl extends RequiredImpl<InlineType>
  implements InlineType {
  serialize(js: any): any {
    return this.inner.serialize(js);
  }

  parse(wire: any): any {
    return this.inner.parse(wire);
  }

  validation(): ValidationBuilder<unknown> {
    // Make sure that we get a presence error first if the inner value is undefined
    return validators.isPresent().andThen(this.inner.validation());
  }
}

export class OptionalDirectValueImpl extends OptionalImpl<InlineType> {
  validation(): ValidationBuilder<unknown> {
    return maybe(this.inner.validation());
  }

  serialize(value: any): any {
    if (value === null || value === undefined) {
      return null;
    } else {
      return this.inner.serialize(value);
    }
  }

  parse(wire: any): any {
    if (wire === null || wire === undefined) {
      return null;
    } else {
      return this.inner.parse(wire);
    }
  }

  required(): Required & InlineType {
    return new RequiredDirectValueImpl(this.inner);
  }
}
