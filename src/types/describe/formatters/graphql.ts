import { Dict, Option } from "ts-std";
import { LabelledType } from "../../fundamental/value";
import { titleize } from "../../utils";
import formatter, { Schema } from "../formatter";
import { PrimitiveLabel, isPrimitive } from "../label";
import { Accumulator, ReporterDelegate } from "../reporter";

class TypeBuffer {
  private buf: string;

  constructor(public name: string) {
    this.buf = `type ${name} {\n`;
  }

  push(s: string): void {
    this.buf += s;
  }

  done(): string {
    return this.buf;
  }
}

class BufferStack implements Accumulator<string> {
  types: TypeBuffer[] = [];
  finished: TypeBuffer[] = [];
  key: Option<string> = null;
  template: Option<string> = null;

  get currentName(): string {
    return this.types[this.types.length - 1].name;
  }

  pushType(name: string): void {
    this.types.push(new TypeBuffer(name));
  }

  push(s: string): void {
    this.types[this.types.length - 1].push(s);
  }

  pushKey(key: string): void {
    this.key = key;
    this.push(`  ${key}: `);
  }

  doneValue(required: boolean): void {
    let suffix = required ? "!" : "";
    this.push(`${suffix}\n`);
  }

  pushTemplate(typeName: string): void {
    this.template = typeName;
    this.pushType(typeName);
    this.key = null;
  }

  pushSubType(): void {
    if (this.template) return;
    let typeName = `${this.currentName}${titleize(this.key!)}`;
    this.push(typeName);
    this.pushType(typeName);
    this.key = null;
  }

  doneType(): void {
    this.push("}");
    let type = this.types.pop();
    this.finished.push(type!);
    this.template = null;
  }

  done(): string {
    let finished = this.finished.map(f => f.done()).join("\n\n");
    if (this.types.length) {
      finished += `\n\n${this.types.map(t => t.done()).join("\n\n")}`;
    }
    return finished;
  }
}

const delegate: ReporterDelegate<BufferStack, string, GraphqlOptions> = {
  openSchema({ options, buffer }): void {
    buffer.pushType(options.name);
  },

  closeSchema({ buffer }): void {
    buffer.doneType();
  },

  emitKey({ key, buffer }): void {
    buffer.pushKey(key);
  },

  openDictionary({ buffer }): void {
    buffer.pushSubType();
  },

  closeDictionary({ buffer }): void {
    buffer.doneType();
  },

  closeValue({ buffer, required }): void {
    buffer.doneValue(required);
  },

  openGeneric({ buffer, type: { label } }): void {
    switch (label.type.kind) {
      case "iterator":
      case "list":
        buffer.push("[");
        break;
      case "pointer":
      default:
    }
  },
  closeGeneric({ buffer, type: { label } }): void {
    switch (label.type.kind) {
      case "iterator":
      case "list":
        buffer.push("!]");
        break;
      case "pointer":
      default:
    }
  },

  emitNamedType({ type, buffer, options }): void {
    if (isPrimitive(type)) {
      primitive({ type, buffer, options });
    } else {
      buffer.push(`${nameToString(type.label.name)}`);
    }
  },

  emitPrimitive({ type, buffer, options }): void {
    let { label } = type as LabelledType<PrimitiveLabel>;

    if (label.name !== undefined) {
      buffer.push(`${options.scalarMap[label.name]}`);
    } else {
      throw new Error(
        `Primitive types must be registered in the scalar map. Found an anonymous primitive with description \`${
          type.label.description
        }\`.`
      );
    }
  }
};

function primitive({
  type,
  buffer,
  options
}: {
  type: LabelledType<PrimitiveLabel>;
  buffer: BufferStack;
  options: GraphqlOptions;
}): void {
  let { label } = type as LabelledType<PrimitiveLabel>;

  if (label.name !== undefined) {
    buffer.push(`${options.scalarMap[label.name]}`);
  } else {
    throw new Error(
      `Primitive types must be registered in the scalar map. Found an anonymous primitive with description \`${
        type.label.description
      }\`.`
    );
  }
}

export interface GraphqlOptions {
  name: string;
  scalarMap: Dict;
}

export const graphql: ((
  schema: Schema,
  options: GraphqlOptions
) => string) = formatter(delegate, BufferStack);

function nameToString(name: string | undefined): string {
  return name || "anonymous";
}
