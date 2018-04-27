import { Buffer } from "../buffer";
import formatter from "../formatter";
import { Optionality } from "../label";
import { ReporterDelegate } from "../reporter";

const delegate: ReporterDelegate<Buffer, string> = {
  openSchema() {
    return `{\n`;
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

export const typescript: ReturnType<typeof formatter> = formatter(
  delegate,
  Buffer
);
