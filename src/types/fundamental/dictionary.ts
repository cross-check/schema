import { ValidationBuilder, validators } from "@cross-check/dsl";
import { Dict, JSONObject, dict, entries, unknown } from "ts-std";
import { DictionaryLabel, Label, Optionality } from "../label";
import { OptionalRefinedType, Type, draftType, strictType } from "../refined";
import { optional } from "../type";
import { BRAND } from "../utils";
import { InlineType } from "./direct-value";
import { Value } from "./value";

function buildSchemaValidation(desc: Dict<Value>): ValidationBuilder<unknown> {
  let obj = dict<ValidationBuilder<unknown>>();

  for (let [key, value] of entries(desc)) {
    if (isInlineType(value)) {
      obj[key] = value!.validation();
    }
  }

  return validators.object(obj);
}

export class PrimitiveDictionary implements InlineType {
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
      if (isInlineType(value)) {
        out[key] = value!.serialize(js[key]);
      }
    }

    return out;
  }

  parse(wire: JSONObject): Dict<unknown> {
    let out: Dict<unknown> = {};

    for (let [key, value] of entries(this.inner)) {
      if (isInlineType(value)) {
        out[key] = value!.parse(wire[key]!);
      }
    }

    return out;
  }

  validation(): ValidationBuilder<unknown> {
    return buildSchemaValidation(this.inner);
  }
}

function isInlineType(type: Value | undefined): type is InlineType {
  if (type === undefined) return false;
  return typeof (type as any).serialize === "function";
}

/* @internal */
export function dictionaryType(inner: Dict<Type>): Type<InlineType> {
  let customDict = dict<Value>();

  for (let [key, value] of entries(inner)) {
    if (isInlineType(strictType(value!))) {
      customDict[key] = strictType(value!);
    }
  }

  let strict = new PrimitiveDictionary(customDict);

  let baseDict = dict<Value>();

  for (let [key, value] of entries(inner)) {
    baseDict[key] = draftType(value!);
  }

  let draft = new PrimitiveDictionary(baseDict);

  return {
    [BRAND]: "RequiredRefinedType" as "RequiredRefinedType",
    strict,
    draft
  };
}

export function Dictionary(
  properties: Dict<Type<InlineType>>
): OptionalRefinedType<InlineType> {
  return optional(dictionaryType(properties));
}
