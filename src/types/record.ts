import { Dict, dict, entries } from "ts-std";
import { DictionaryType } from "./dictionary";
import {
  AnyType,
  OptionalType,
  RequiredType,
  optional,
  required as requiredType
} from "./type";

export function Record(properties: Dict<AnyType>): OptionalType {
  return optional(new DictionaryType(required(properties)));
}

function required(properties: Dict<AnyType>): Dict<RequiredType> {
  let out = dict<RequiredType>();

  for (let [key, value] of entries(properties)) {
    out[key] = requiredType(value!);
  }

  return out;
}
