import { ValidationBuilder, validators } from "@cross-check/dsl";
import { Dict, Option, dict, entries, unknown } from "ts-std";
import { DictionaryLabel, Label, typeNameOf } from "../label";
import { Type, baseType, parse, serialize, validationFor } from "./value";

function buildSchemaValidation(desc: Dict<Type>): ValidationBuilder<unknown> {
  let obj = dict<ValidationBuilder<unknown>>();

  for (let [key, value] of entries(desc)) {
    obj[key] = value!.validation();
  }

  return validators.strictObject(obj);
}

export interface DictionaryType extends Type {
  label: Label<DictionaryLabel>;
}

export class DictionaryImpl implements DictionaryType {
  constructor(
    protected inner: Dict<Type>,
    private typeName: string | undefined,
    readonly isRequired: boolean,
    readonly base: Option<DictionaryType>
  ) { }

  required(isRequired = true): Type {
    return new DictionaryImpl(this.inner, this.typeName, isRequired, this.base);
  }

  named(arg: Option<string>): Type {
    let name = `${arg}${typeNameOf(this.typeName)}`;
    return new DictionaryImpl(
      this.inner,
      arg === null ? undefined : name,
      this.isRequired,
      this.base
    );
  }

  get label(): Label<DictionaryLabel> {
    return {
      type: { kind: "dictionary", members: this.inner },
      description: "dictionary",
      name: this.typeName,
      registeredName: this.typeName === undefined ? undefined : this.typeName
    };
  }

  serialize(js: Dict): Option<Dict> | undefined {
    return serialize(js, !this.isRequired, () => {
      let out: Dict = {};

      for (let [key, value] of entries(this.inner)) {
        out[key] = value!.serialize(js[key]!);
      }

      return out;
    });
  }

  parse(wire: Dict): Option<Dict> | undefined {
    return parse(wire, !this.isRequired, () => {
      let out: Dict = {};

      for (let [key, value] of entries(this.inner)) {
        out[key] = value!.parse(wire[key]);
      }

      return out;
    });
  }

  validation(): ValidationBuilder<unknown> {
    let validation = buildSchemaValidation(this.inner);

    return validationFor(validation, this.isRequired);
  }
}

export type ConstructDictionary = (d: Dict<Type>) => DictionaryType;

export function Dictionary(members: Dict<Type>): DictionaryType {
  let strictDict = dict<Type>();
  let draftDict = dict<Type>();

  for (let [key, value] of entries(members)) {
    strictDict[key] = value!;
    draftDict[key] = baseType(value!).required(false);
  }

  let draft = new DictionaryImpl(draftDict, undefined, false, null);
  return new DictionaryImpl(strictDict, undefined, false, draft);
}
