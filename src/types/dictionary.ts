import { ValidationBuilder, validators } from "@cross-check/dsl";
import { Dict, JSONObject, dict, entries, unknown } from "ts-std";
import { Label, Optionality } from "./label";
import {
  AnyType,
  OptionalType,
  PrimitiveType,
  Type,
  asType,
  optional
} from "./type";

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

  serialize(js: Dict<unknown>): JSONObject {
    let out: JSONObject = {};

    for (let [key, value] of entries(this.inner)) {
      out[key] = value!.serialize(js[key]);
    }

    return out;
  }

  parse(wire: JSONObject): Dict<unknown> {
    let out: Dict<unknown> = {};

    for (let [key, value] of entries(this.inner)) {
      out[key] = value!.parse(wire[key]!);
    }

    return out;
  }

  validation(): ValidationBuilder<unknown> {
    return buildSchemaValidation(this.inner);
  }
}

/* @internal */
export function dictionaryType(inner: Dict<AnyType>): Type {
  let customDict = dict<PrimitiveType>();

  for (let [key, value] of entries(inner)) {
    customDict[key] = value!.asType().custom;
  }

  let custom = new PrimitiveDictionary(customDict);

  let baseDict = dict<PrimitiveType>();

  for (let [key, value] of entries(inner)) {
    baseDict[key] = value!.asType().base;
  }

  let base = new PrimitiveDictionary(baseDict);

  return asType(custom, base);
}

export function Dictionary(properties: Dict<AnyType>): OptionalType {
  return optional(dictionaryType(properties));
}
