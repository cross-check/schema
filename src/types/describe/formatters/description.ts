import { Buffer } from "../buffer";
import formatter, { Formatter } from "../formatter";
import { Optionality } from "../label";
import { Position, ReporterDelegate } from "../reporter";

const delegate: ReporterDelegate<Buffer, string> = {
  openSchema() {
    return `{\n`;
  },
  closeSchema() {
    return `}`;
  },
  emitKey({ key, optionality, nesting }): string {
    return `${pad(nesting * 2)}${formattedKey(key, optionality)}: `;
  },

  closeDictionary({ nesting }): string {
    return `${pad(nesting * 2)}}`;
  },

  closeValue({ position }): string | void {
    if (position === Position.First || position === Position.Middle) {
      return ",\n";
    } else {
      return "\n";
    }
  },

  closeList(): void {
    /* noop */
  },

  openDictionary(): string {
    return `{\n`;
  },
  openList(): string {
    return "list of ";
  },
  emitPrimitive({ label }): string {
    return `<${label.type.description}>`;
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

export const describe: Formatter = formatter(delegate, Buffer);
