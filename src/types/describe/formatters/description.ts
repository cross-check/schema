import { Buffer } from "../buffer";
import formatter, { Formatter } from "../formatter";
import { Optionality } from "../label";
import { Position, ReporterDelegate } from "../reporter";

const delegate: ReporterDelegate<Buffer, string, void> = {
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
    return `<${label.type.description}>`;
  },
  endPrimitive(): void {
    /* noop */
  },
  emitNamedType({ type: { label } }): string {
    return `${label.name.name}`;
  },

  openTemplatedValue() {
    throw new Error("unimplemented");
  },

  closeTemplatedValue() {
    throw new Error("unimplemented");
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
