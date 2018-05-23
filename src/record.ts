import { Environment, ValidationError, validate } from "@cross-check/core";
import build from "@cross-check/dsl";
import { Task } from "no-show";
import { Dict, dict, entries } from "ts-std";
import { DictionaryImpl, DictionaryType } from "./types/fundamental/dictionary";
import { Type, baseType } from "./types/fundamental/value";
import { DictionaryLabel, Label } from "./types/label";

class BaseRecordImpl extends DictionaryImpl implements BaseRecord {
  constructor(readonly name: string, inner: Dict<Type>, required: boolean) {
    super(inner, name, required, null);
  }

  required(isRequired = true): Type {
    return new BaseRecordImpl(this.name, this.inner, isRequired);
  }

  validate(obj: Dict, env: Environment): Task<ValidationError[]> {
    return validate(obj, build(this.validation()), null, env);
  }
}

class RecordImpl extends BaseRecordImpl implements Record {
  base: BaseRecordImpl;

  constructor(
    name: string,
    inner: Dict<Type>,
    required: boolean,
    base: BaseRecordImpl
  ) {
    super(name, inner, required);
    this.base = base;
  }

  get draft(): BaseRecord {
    return this.base!;
  }

  get label(): Label<DictionaryLabel> {
    return {
      ...super.label,
      name: this.name
    };
  }

  required(isRequired = true): Type {
    return new RecordImpl(this.name, this.inner, isRequired, this.base);
  }
}

export function Record(name: string, members: Dict<Type>): Record {
  let strictDict = dict<Type>();
  let draftDict = dict<Type>();

  for (let [key, value] of entries(members)) {
    strictDict[key] = value!;
    draftDict[key] = baseType(value!).required(false);
  }

  let draft = new BaseRecordImpl(name, draftDict, false);
  return new RecordImpl(name, strictDict, false, draft);
}

export interface BaseRecord extends DictionaryType {
  readonly name: string;
  validate(obj: Dict, env: Environment): Task<ValidationError[]>;
}

export interface Record extends BaseRecord {
  readonly name: string;
  readonly draft: BaseRecord;
}
