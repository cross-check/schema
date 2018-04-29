import { Buffer } from "../buffer";
import formatter, { Formatter } from "../formatter";
import { Optionality } from "../label";
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
  emitKey({ key, optionality, nesting }): string {
    return `${pad(nesting * 2)}${formattedKey(key, optionality)}: `;
  },
  closeValue(): string {
    return ";\n";
  },

  openList(): string {
    return "Array<";
  },
  closeList(): string {
    return ">";
  },

  emitPrimitive({ label }): string {
    return `${label.type.typescript}`;
  }
};

function formattedKey(key: string, optionality: Optionality): string {
  if (optionality === Optionality.Optional) {
    return `${key}?`;
  } else {
    return key;
  }
}

function pad(size: number): string {
  return " ".repeat(size);
}

export const typescript: Formatter<TypescriptOptions> = formatter(
  delegate,
  Buffer
);
