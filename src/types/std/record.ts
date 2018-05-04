import { Dict, dict, entries } from "ts-std";
import { dictionaryType } from "../fundamental/dictionary";
import { DirectValue } from "../fundamental/direct-value";
import {
  OptionalRefinedType,
  RefinedType,
  RequiredRefinedType
} from "../refined";
import { optional, requiredType } from "../type";

export function Record(
  properties: Dict<RefinedType<DirectValue>>
): OptionalRefinedType<DirectValue> {
  return optional(dictionaryType(required(properties)));
}

function required(
  properties: Dict<RefinedType<DirectValue>>
): Dict<RequiredRefinedType<DirectValue>> {
  let out = dict<RequiredRefinedType<DirectValue>>();

  for (let [key, value] of entries(properties)) {
    out[key] = requiredType(value!);
  }

  return out;
}
