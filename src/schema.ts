import {
  Environment,
  ValidationDescriptor,
  ValidationError,
  validate
} from "@cross-check/core";
import build, { ValidationBuilder, validators } from "@cross-check/dsl";
import { Task } from "no-show";
import { Dict, JSONObject, dict, entries, unknown } from "ts-std";
import { DictionaryLabel, Label } from "./types/describe";
import { AnyType, PrimitiveType } from "./types/type";

export default class Schema {
  constructor(public name: string, private obj: Dict<AnyType>) {}

  get draft(): ValidatableSchema {
    let schema = dict<PrimitiveType>();

    for (let [key, value] of entries(this.obj)) {
      schema[key] = value!.asType().base;
    }

    return new ValidatableSchema(schema, this.name);
  }

  get label(): DictionaryLabel {
    return this.narrow.label;
  }

  validate(obj: Dict<unknown>, env: Environment): Task<ValidationError[]> {
    return this.narrow.validate(obj, env);
  }

  parse(wire: JSONObject): Dict<unknown> {
    return this.narrow.parse(wire);
  }

  serialize(js: Dict<unknown>): JSONObject {
    return this.narrow.serialize(js);
  }

  private get narrow(): ValidatableSchema {
    let schema = dict<PrimitiveType>();

    for (let [key, value] of entries(this.obj)) {
      schema[key] = value!.asType().custom;
    }

    return new ValidatableSchema(schema, this.name);
  }
}

export class ValidatableSchema {
  private schemaValidation: ValidationDescriptor;

  constructor(private inner: Dict<PrimitiveType>, readonly name: string) {
    this.schemaValidation = buildSchemaValidation(inner);
  }

  get label(): DictionaryLabel {
    let members = dict<Label>();

    for (let [key, value] of entries(this.inner)) {
      members[key] = value!.label;
    }

    return { kind: "dictionary", members };
  }

  validate(obj: Dict<unknown>, env: Environment): Task<ValidationError[]> {
    return validate(obj, this.validation(), null, env);
  }

  validation(): ValidationDescriptor {
    return this.schemaValidation;
  }

  parse(wire: JSONObject): Dict<unknown> {
    let out: Dict<unknown> = {};

    for (let [key, value] of entries(this.inner)) {
      out[key] = value!.parse(wire[key]!);
    }

    return out;
  }

  serialize(js: Dict<unknown>): JSONObject {
    let out: JSONObject = {};

    for (let [key, value] of entries(this.inner)) {
      out[key] = value!.serialize(js[key]);
    }

    return out;
  }
}

function buildSchemaValidation(desc: Dict<PrimitiveType>) {
  let obj = dict<ValidationBuilder<unknown>>();

  for (let [key, value] of entries(desc)) {
    obj[key] = value!.validation();
  }

  return build(validators.object(obj));
}
