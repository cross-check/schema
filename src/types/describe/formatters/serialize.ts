import { Buffer } from "../buffer";
import formatter, { Formatter } from "../formatter";
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

  openGeneric({ type: { label } }): string {
    return `{ "type": "${label.type.kind}", "of": `;
  },
  closeGeneric(): string {
    return " }";
  },

  emitNamedType({ type: { label }, buffer }): void {
    buffer.push(`${JSON.stringify(label.name)}`);
  },

  emitPrimitive({ type, buffer }): void {
    let { name, args } = type.label;
    buffer.push(`{ "type": ${JSON.stringify(name)}, `);
    if (args !== undefined) {
      buffer.push(`"details": ${JSON.stringify(args)}, `);
    }

    buffer.push(`"required": ${type.isRequired} }`);
  }
};

function pad(size: number): string {
  return " ".repeat(size);
}

export const serialize: Formatter = formatter(delegate, Buffer);
