import { Environment, ValidationError, validate } from "@cross-check/core";
import build from "@cross-check/dsl";
import { Task } from "no-show";
import { Dict, JSONObject, dict, entries, unknown } from "ts-std";
import { DictionaryLabel, Label } from "./types/describe";
import { PrimitiveDictionary } from "./types/fundamental/dictionary";
import { Value } from "./types/fundamental/value";
import { Type, draftType, strictType } from "./types/refined";

export default class Schema {
  constructor(public name: string, private obj: Dict<Type>) {}

  get draft(): ValidatableSchema {
    let schema = dict<Value>();

    for (let [key, value] of entries(this.obj)) {
      schema[key] = draftType(value!);
    }

    return new ValidatableSchema(schema, this.name);
  }

  get label(): Label<DictionaryLabel> {
    return this.custom.label;
  }

  validate(obj: Dict<unknown>, env: Environment): Task<ValidationError[]> {
    return this.custom.validate(obj, env);
  }

  parse(wire: JSONObject): Dict<unknown> {
    return this.custom.parse(wire);
  }

  serialize(js: Dict<unknown>): JSONObject {
    return this.custom.serialize(js);
  }

  get custom(): ValidatableSchema {
    let schema = dict<Value>();

    for (let [key, value] of entries(this.obj)) {
      schema[key] = strictType(value!);
    }

    return new ValidatableSchema(schema, this.name);
  }
}

export class ValidatableSchema extends PrimitiveDictionary {
  constructor(inner: Dict<Value>, readonly name: string) {
    super(inner);
  }

  get label(): Label<DictionaryLabel> {
    return {
      ...super.label,
      name: this.name
    };
  }

  validate(obj: Dict<unknown>, env: Environment): Task<ValidationError[]> {
    return validate(obj, build(this.validation()), null, env);
  }
}
