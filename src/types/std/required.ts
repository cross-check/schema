import { Dict, dict, entries } from "ts-std";
import { Type } from "../fundamental/value";
import { Dictionary } from "../index";

export function Required(properties: Dict<Type>): Type {
  return Dictionary(required(properties));
}

export function required(properties: Dict<Type>): Dict<Type> {
  let out = dict<Type>();

  for (let [key, value] of entries(properties)) {
    out[key] = value!.required();
  }

  return out;
}
