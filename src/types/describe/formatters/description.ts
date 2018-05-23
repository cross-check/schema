import { Buffer } from "../buffer";
import formatter, { Formatter } from "../formatter";
import { isPrimitive } from "../label";
import { Position, ReporterDelegate } from "../reporter";

const delegate: ReporterDelegate<Buffer, string, void> = {
  openSchema() {
    return `{\n`;
  },

  closeSchema() {
    return `}`;
  },

  emitKey({ key, required, nesting }): string {
    return `${pad(nesting * 2)}${formattedKey(key, required)}: `;
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

  openGeneric({ type: { label } }) {
    switch (label.type.kind) {
      case "iterator":
        return "has many ";
      case "pointer":
        return "has one ";
      case "list":
        return "list of ";
    }
  },

  closeGeneric() {
    /* noop */
  },

  openDictionary(): string {
    return `{\n`;
  },

  emitPrimitive({ type: { label } }): string {
    return `<${label.description}>`;
  },

  emitNamedType({ type }): string {
    let { label } = type;

    if (isPrimitive(type)) {
      return `<${type.label.description}>`;
    } else {
      return `${label.name}`;
    }
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

export const describe: Formatter = formatter(delegate, Buffer);
