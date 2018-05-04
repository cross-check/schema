import { ValidationBuilder, validators } from "@cross-check/dsl";
import { Dict, JSONObject, dict, entries, unknown } from "ts-std";
import { DictionaryLabel, Label, Optionality } from "../label";
import { OptionalRefinedType, RefinedType } from "../refined";
import { optional } from "../type";
import { BRAND } from "../utils";
import { DirectValue } from "./direct-value";
import { Value } from "./value";

function buildSchemaValidation(desc: Dict<Value>): ValidationBuilder<unknown> {
  let obj = dict<ValidationBuilder<unknown>>();

  for (let [key, value] of entries(desc)) {
    if (isDirectValue(value)) {
      obj[key] = value!.validation();
    }
  }

  return validators.object(obj);
}

export class PrimitiveDictionary implements DirectValue {
  [BRAND]: "PrimitiveType";

  constructor(private inner: Dict<Value>) {}

  get label(): Label<DictionaryLabel> {
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
      if (isDirectValue(value)) {
        out[key] = value!.serialize(js[key]);
      }
    }

    return out;
  }

  parse(wire: JSONObject): Dict<unknown> {
    let out: Dict<unknown> = {};

    for (let [key, value] of entries(this.inner)) {
      if (isDirectValue(value)) {
        out[key] = value!.parse(wire[key]!);
      }
    }

    return out;
  }

  validation(): ValidationBuilder<unknown> {
    return buildSchemaValidation(this.inner);
  }
}

function isDirectValue(type: Value | undefined): type is DirectValue {
  if (type === undefined) return false;
  return typeof (type as any).serialize === "function";
}

/* @internal */
export function dictionaryType(
  inner: Dict<RefinedType>
): RefinedType<DirectValue> {
  let customDict = dict<Value>();

  for (let [key, value] of entries(inner)) {
    if (isDirectValue(value!.strict)) {
      customDict[key] = value!.strict;
    }
  }

  let strict = new PrimitiveDictionary(customDict);

  let baseDict = dict<Value>();

  for (let [key, value] of entries(inner)) {
    baseDict[key] = value!.draft;
  }

  let draft = new PrimitiveDictionary(baseDict);

  return {
    [BRAND]: "RequiredRefinedType",
    strict,
    draft
  };
}

export function Dictionary(
  properties: Dict<RefinedType>
): OptionalRefinedType<DirectValue> {
  return optional(dictionaryType(properties));
}
