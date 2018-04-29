import { Buffer } from "../buffer";
import formatter, { Formatter } from "../formatter";
import { Optionality } from "../label";
import { Position, ReporterDelegate } from "../reporter";

const delegate: ReporterDelegate<Buffer, string, void> = {
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
  emitKey({ key, nesting }): string {
    return `${pad(nesting * 2)}${JSON.stringify(key)}: `;
  },
  closeValue({ position }): string {
    if (position === Position.Last) {
      return "\n";
    } else {
      return ",\n";
    }
  },

  openList(): string {
    return `{ "type": "list", "of": `;
  },
  closeList(): string {
    return " }";
  },

  emitPrimitive({ label }): string {
    let { name, args } = label.type.schemaType;
    let isRequired = label.optionality === Optionality.Required;
    return `{ "type": ${JSON.stringify(name)}, "details": ${JSON.stringify(
      args
    )}, "required": ${isRequired} }`;
  }
};

function pad(size: number): string {
  return " ".repeat(size);
}

export const serialize: Formatter = formatter(delegate, Buffer);
