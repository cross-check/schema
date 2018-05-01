import { ValidationBuilder, validators } from "@cross-check/dsl";
import { Dict, dict, entries, unknown } from "ts-std";
import { Label, Optionality } from "./label";
import { AsType, OptionalType, PrimitiveType, Type, optional } from "./type";

function buildSchemaValidation(
  desc: Dict<PrimitiveType>
): ValidationBuilder<unknown> {
  let obj = dict<ValidationBuilder<unknown>>();

  for (let [key, value] of entries(desc)) {
    obj[key] = value!.validation();
  }

  return validators.object(obj);
}

export class PrimitiveDictionary implements PrimitiveType {
  constructor(private inner: Dict<PrimitiveType>) {}

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

export class DictionaryType implements Type {
  constructor(private inner: Dict<AsType>) {}

  // A dictionary's type is the type of its members
  get custom(): PrimitiveType {
    let o = dict<PrimitiveType>();

    for (let [key, value] of entries(this.inner)) {
      o[key] = value!.asType().custom;
    }

    return new PrimitiveDictionary(o);
  }

  // A dictionary's base type is the base type of the members, with all inner types optional
  get base(): PrimitiveType {
    let o = dict<PrimitiveType>();

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
  return optional(new DictionaryType(properties));
}
