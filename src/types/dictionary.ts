import { ValidationBuilder, validators } from "@cross-check/dsl";
import { Dict, dict, entries, unknown } from "ts-std";
import { Label, Optionality } from "./label";
import { AsType, OptionalType, Primitive, Type } from "./type";
import { Interface } from "./utils";

function buildSchemaValidation(
  desc: Dict<Primitive>
): ValidationBuilder<unknown> {
  let obj = dict<ValidationBuilder<unknown>>();

  for (let [key, value] of entries(desc)) {
    obj[key] = value!.validation();
  }

  return validators.object(obj);
}

export class PrimitiveDictionary implements Primitive {
  constructor(private inner: Dict<Primitive>) {}

  get label(): Label {
    let members = dict<Label>();

    for (let [key, value] of entries(this.inner)) {
      members[key] = value!.label;
    }

    return {
      type: { kind: "dictionary", members },
      optionality: Optionality.None
    };
  }

  validation(): ValidationBuilder<unknown> {
    return buildSchemaValidation(this.inner);
  }
}

export class DictionaryType implements Interface<Type> {
  constructor(private inner: Dict<AsType>) {}

  // A dictionary's type is the type of its members
  get type(): Primitive {
    let o = dict<Primitive>();

    for (let [key, value] of entries(this.inner)) {
      o[key] = value!.asType().type;
    }

    return new PrimitiveDictionary(o);
  }

  // A dictionary's base type is the base type of the members, with all inner types optional
  get base(): Primitive {
    let o = dict<Primitive>();

    for (let [key, value] of entries(this.inner)) {
      o[key] = value!.asType().base;
    }

    return new PrimitiveDictionary(o);
  }

  asRequired(): Type {
    return this;
  }

  asType(): Type {
    return this;
  }
}

export function Dictionary(properties: Dict<AsType>): OptionalType {
  return OptionalType.forType(new DictionaryType(properties));
}
