import { Buffer } from "../buffer";
import formatter, { Formatter } from "../formatter";
import { Label, Optionality, PrimitiveLabel } from "../label";
import { Position, ReporterDelegate } from "../reporter";

const delegate: ReporterDelegate<Buffer, string, void> = {
  openSchema() {
    return `{\n`;
  },
  closeSchema() {
    return `}`;
  },

  openDictionary(): string {
    return `Dictionary({\n`;
  },
  emitKey({ key, nesting }): string {
    return `${pad(nesting * 2)}${key}: `;
  },
  closeDictionary({ buffer, nesting, position, optionality }): string | void {
    buffer.push(`${pad(nesting * 2)}})`);

    if (
      optionality === Optionality.Required &&
      position !== Position.ListItem &&
      position !== Position.PointerItem
    ) {
      buffer.push(".required()");
    }
  },

  openGeneric({ buffer, label }): void {
    switch (label.type.kind) {
      case "iterator":
        buffer.push("hasMany(");
        break;
      case "list":
        buffer.push("List(");
        break;
      case "pointer":
        buffer.push("hasOne(");
    }
  },
  closeGeneric({ buffer, position, label }): void {
    buffer.push(")");

    if (
      label.optionality === Optionality.Required &&
      position !== Position.ListItem &&
      position !== Position.PointerItem
    ) {
      buffer.push(".required()");
    }
  },

  emitNamedType({ label, buffer }): void {
    buffer.push(`${label.name}`);
  },

  closeValue({ position }): string | void {
    if (position === Position.First || position === Position.Middle) {
      return ",\n";
    } else if (position === Position.Last) {
      return "\n";
    }
  },

  emitPrimitive({ label }): string {
    return formatType(label);
  },

  endPrimitive({ position, optionality }): string | void {
    if (
      optionality === Optionality.Required &&
      position !== Position.ListItem &&
      position !== Position.IteratorItem
    ) {
      return `.required()`;
    }
  }
};

function formatType(label: Label<PrimitiveLabel>) {
  let { name, args } = label.type.schemaType;
  let out = `${name}(${args.join(", ")})`;

  return out;
}

function pad(size: number): string {
  return " ".repeat(size);
}

export const schemaFormat: Formatter<void> = formatter(delegate, Buffer);
