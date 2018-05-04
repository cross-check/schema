import { ValidationError } from "@cross-check/core";
import { Schema } from "@cross-check/schema";
import { Task } from "no-show";
import { Dict, unknown } from "ts-std";

export const ENV = {
  get(object: unknown, key: string): unknown {
    if (object === null || object === undefined) return;
    return (object as Dict<unknown>)[key];
  }
};

export function strip(
  strings: TemplateStringsArray,
  ...expressions: unknown[]
): string {
  let result = strings
    .map((s, i) => `${s}${expressions[i] ? expressions[i] : ""}`)
    .join("");

  let lines = result.split("\n").slice(1, -1);

  let leading = lines.reduce((accum, line) => {
    let size = line.match(/^(\s*)/)![1].length;
    return Math.min(accum, size);
  }, Infinity);

  lines = lines.map(l => l.slice(leading));

  return lines.join("\n");
}

export function validateDraft(
  schema: Schema,
  obj: Dict<unknown>
): Task<ValidationError[]> {
  return schema.draft.validate(obj, ENV);
}

export function validatePublished(
  schema: Schema,
  obj: Dict<unknown>
): Task<ValidationError[]> {
  return schema.validate(obj, ENV);
}

export function typeError(kind: string, path: string): ValidationError {
  return { message: { details: kind, name: "type" }, path: path.split(".") };
}

export function missingError(path: string) {
  return typeError("present", path);
}

export function error(
  kind: string,
  problem: unknown,
  path: string
): ValidationError {
  return { message: { details: problem, name: kind }, path: path.split(".") };
}

export const GRAPHQL_SCALAR_MAP = {
  // Custom scalars
  SingleLine: "SingleLine",
  SingleWord: "SingleWord",
  ISODate: "ISODate",
  Url: "Url",

  Text: "String",
  Integer: "Int",
  Number: "Float",
  Boolean: "Boolean"
};
