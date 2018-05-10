import { JSON as JSONValue } from "ts-std";
import { LabelledType } from "../../fundamental/value";
import { Buffer } from "../buffer";
import formatter, { Formatter } from "../formatter";
import { Optionality, PrimitiveLabel } from "../label";
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

  openGeneric({ buffer, type: { label } }): void {
    switch (label.type.kind) {
      case "iterator":
        buffer.push("hasMany(");
        break;
      case "list":
        buffer.push("List(");
        break;
      case "pointer":
        buffer.push("hasOne(");
        break;
      default:
        throw new Error("unreacahable");
    }
  },
  closeGeneric({ buffer, position, type }): void {
    buffer.push(")");

    if (
      type.isRequired &&
      position !== Position.ListItem &&
      position !== Position.PointerItem
    ) {
      buffer.push(".required()");
    }
  },

  emitNamedType({ type: { label }, buffer }): void {
    buffer.push(`${label.name.name}`);
  },

  closeValue({ position }): string | void {
    if (position === Position.First || position === Position.Middle) {
      return ",\n";
    } else if (position === Position.Last) {
      return "\n";
    }
  },

  emitPrimitive({ type }): string {
    return formatType(type);
  },

  endPrimitive({ position, optionality }): string | void {
    if (
      optionality === Optionality.Required &&
      position !== Position.ListItem &&
      position !== Position.IteratorItem
    ) {
      return `.required()`;
    }
  },

  openTemplatedValue() {
    throw new Error("unimplemented");
  },

  closeTemplatedValue() {
    throw new Error("unimplemented");
  }
};

function formatType(type: LabelledType<PrimitiveLabel>) {
  let { name, args } = type.label.type.schemaType;
  let out = `${name}(${formatArgs(args)})`;

  return out;
}

function formatArgs(args: JSONValue | undefined): string {
  if (Array.isArray(args)) {
    return JSON.stringify(args).slice(1, -1);
  } else if (args === undefined) {
    return "";
  } else {
    return JSON.stringify(args);
  }
}

function pad(size: number): string {
  return " ".repeat(size);
}

export const schemaFormat: Formatter<void> = formatter(delegate, Buffer);
