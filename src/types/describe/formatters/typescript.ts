import { Buffer } from "../buffer";
import formatter, { Formatter } from "../formatter";
import { ReporterDelegate } from "../reporter";

export interface TypescriptOptions {
  name: string;
}

const delegate: ReporterDelegate<Buffer, string, TypescriptOptions> = {
  openSchema({ options }) {
    return `export interface ${options.name} {\n`;
  },
  closeSchema(): string {
    return `}`;
  },

  openDictionary(): string {
    return `{\n`;
  },
  closeDictionary({ buffer, nesting }): void {
    buffer.push(`${pad(nesting * 2)}}`);
  },
  emitKey({ key, required, nesting }): string {
    return `${pad(nesting * 2)}${formattedKey(key, required)}: `;
  },
  closeValue(): string {
    return ";\n";
  },

  openGeneric({ type: { label } }): string | void {
    switch (label.type.kind) {
      case "iterator":
      case "list":
        return `Array<`;
      case "pointer":
      default:
    }
  },

  closeGeneric({ type: { label } }): string | void {
    switch (label.type.kind) {
      case "iterator":
      case "list":
        return `>`;
      case "pointer":
      default:
    }
  },

  emitNamedType({ type: { label }, buffer }): void {
    buffer.push(`${label.name}`);
  },

  emitPrimitive({ type: { label } }): string {
    return `${label.type.typescript}`;
  }
};

function formattedKey(key: string, required: boolean): string {
  if (required) {
    return key;
  } else {
    return `${key}?`;
  }
}

function pad(size: number): string {
  return " ".repeat(size);
}

export const typescript: Formatter<TypescriptOptions> = formatter(
  delegate,
  Buffer
);
