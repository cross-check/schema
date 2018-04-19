import {
  Environment,
  ValidationDescriptor,
  ValidationError,
  validate
} from "@cross-check/core";
import build, { ValidationBuilder, validators } from "@cross-check/dsl";
import { Task } from "no-show";
import { Dict, dict, entries, unknown } from "ts-std";
import { DictionaryLabel, Label } from "./types/describe";
import { AsType, Primitive } from "./types/type";

export default class Schema {
  constructor(public name: string, private obj: Dict<AsType>) {}

  get draft(): ValidatableSchema {
    let schema = dict<Primitive>();

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

  private get narrow(): ValidatableSchema {
    let schema = dict<Primitive>();

    for (let [key, value] of entries(this.obj)) {
      schema[key] = value!.asType().type;
    }

    return new ValidatableSchema(schema, this.name);
  }
}

export class ValidatableSchema {
  private schemaValidation: ValidationDescriptor;

  constructor(private inner: Dict<Primitive>, readonly name: string) {
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
    return validate(env, obj, this.validation(), null);
  }

  validation(): ValidationDescriptor {
    return this.schemaValidation;
  }
}

function buildSchemaValidation(desc: Dict<Primitive>) {
  let obj = dict<ValidationBuilder<unknown>>();

  for (let [key, value] of entries(desc)) {
    obj[key] = value!.validation();
  }

  return build(validators.object(obj));
}
