import { Dict, Option } from "ts-std";
import { titleize } from "../../utils";
import formatter, { Schema } from "../formatter";
import { Name, Optionality, isAnonymous } from "../label";
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
  closeValue({ buffer, optionality }): void {
    buffer.doneValue(optionality === Optionality.Required);
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

  openTemplatedValue({ buffer, type: { label } }): void {
    buffer.pushTemplate(nameToString(label.name));
  },
  closeTemplatedValue(): void {},

  emitNamedType({ type: { label }, buffer }): void {
    buffer.push(`${nameToString(label.name)}`);
  },

  emitPrimitive({ type: { label }, buffer, options }): void {
    buffer.push(`${options.scalarMap[label.type.schemaType.name]}`);
  },
  endPrimitive(): void {
    /* noop */
  }
};

export interface GraphqlOptions {
  name: string;
  scalarMap: Dict;
}

export const graphql: ((
  schema: Schema,
  options: GraphqlOptions
) => string) = formatter(delegate, BufferStack);

function nameToString(name: Name): string {
  if (isAnonymous(name)) {
    return "anonymous";
  } else {
    return name.name;
  }
}
