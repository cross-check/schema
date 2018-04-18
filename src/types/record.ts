import { Dict, dict, entries } from "ts-std";
import { DictionaryType } from "./dictionary";
import { AsRequired, OptionalType, Type } from "./type";

export function Record(properties: Dict<AsRequired>): OptionalType {
  return OptionalType.forType(new DictionaryType(required(properties)));
}

function required(properties: Dict<AsRequired>): Dict<Type> {
  let out = dict<Type>();

  for (let [key, value] of entries(properties)) {
    out[key] = value!.asRequired();
  }

  return out;
}
