import { Dict, dict, entries } from "ts-std";
import { dictionaryType } from "../fundamental/dictionary";
import { InlineType } from "../fundamental/direct-value";
import { OptionalRefinedType, RequiredRefinedType, Type } from "../refined";
import { optional, requiredType } from "../type";

export function Record(
  properties: Dict<Type<InlineType>>
): OptionalRefinedType<InlineType> {
  return optional(dictionaryType(required(properties)));
}

function required(
  properties: Dict<Type<InlineType>>
): Dict<RequiredRefinedType<InlineType>> {
  let out = dict<RequiredRefinedType<InlineType>>();

  for (let [key, value] of entries(properties)) {
    out[key] = requiredType(value!);
  }

  return out;
}
