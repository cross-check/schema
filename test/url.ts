import { ValidationBuilder, validators } from "@cross-check/dsl";
import {
  Interface,
  OptionalType,
  derived,
  primitiveLabel,
  toPrimitive
} from "copilot-schema";
import { unknown } from "ts-std";
import { format } from "./format";

export type UrlType =
  | "absolute"
  | "relative"
  | "http"
  | "https"
  | "protocol-relative"
  | "leading-slash";

function formatForType(type: UrlType): RegExp {
  switch (type) {
    case "absolute":
      return /^(https?:)?\/\/[^?#]+(\?[^#]*)?(#.*)?$/;
    case "relative":
      return /^(?!(https?:)?\/\/)[^?#]+(\?[^#]*)?(#.*)?$/;
    case "http":
      return /^http:\/\/[^?#]+(\?[^#]*)?(#.*)?$/;
    case "https":
      return /^https:\/\/[^?#]+(\?[^#]*)?(#.*)?$/;
    case "protocol-relative":
      return /^\/\/[^?#]+(\?[^#]*)?(#.*)?$/;
    case "leading-slash":
      return /^[\/][^?#]+(\?[^#]*)?(#.*)?$/;
  }
}

export function url(...args: UrlType[]): ValidationBuilder<unknown> {
  if (args.length === 0) {
    return url("absolute");
  }

  return args
    .map(formatForType)
    .map(format)
    .reduce((chain, validator) => chain.or(validator))
    .catch(() => [{ path: [], message: { key: "url", args } }]);
}

export function Url(...args: UrlType[]): Interface<OptionalType> {
  let validator = url(...args);
  let urlPrimitive = toPrimitive(validator, primitiveLabel("url", "string"));
  let stringPrimitive = toPrimitive(
    validators.isString(),
    primitiveLabel("string", "string")
  );

  return derived(urlPrimitive, stringPrimitive)();
}
