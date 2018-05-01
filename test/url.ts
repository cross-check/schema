import { ValidationBuilder } from "@cross-check/dsl";
import {
  Label,
  OptionalType,
  PrimitiveType,
  label,
  type,
  types
} from "@cross-check/schema";
import { unknown } from "ts-std";
import { format } from "./format";

export type UrlType =
  | "absolute"
  | "relative"
  | "http"
  | "https"
  | "protocol-relative"
  | "leading-slash";

function formatForType(urlType: UrlType): RegExp {
  switch (urlType) {
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

export function url(...details: UrlType[]): ValidationBuilder<unknown> {
  if (details.length === 0) {
    return url("absolute");
  }

  return details
    .map(formatForType)
    .map(format)
    .reduce((chain, validator) => chain.or(validator))
    .catch(() => [{ path: [], message: { name: "url", details } }]);
}

export class Urlish {
  constructor(
    public protocol: string,
    public host: string,
    public pathname: string
  ) {}

  toString(): string {
    return `${this.protocol}://${this.host}/${this.pathname}`;
  }
}

class UrlPrimitive implements PrimitiveType {
  constructor(private options: UrlType[]) {}

  get label(): Label {
    return label({
      name: "Url",
      args: this.options,
      description: "url",
      typescript: "string"
    });
  }

  validation(): ValidationBuilder<unknown> {
    return url(...this.options);
  }

  serialize(input: Urlish): string {
    return input.toString();
  }

  parse(input: string): Urlish {
    return urlish(input);
  }
}

export function urlish(full: string) {
  let result = full.match(/^(https?):\/\/([^/]*)\/(.*)$/)!;
  return new Urlish(result[1], result[2], result[3]);
}

export function Url(...args: UrlType[]): OptionalType {
  return type(new UrlPrimitive(args), types.Text())();
}
