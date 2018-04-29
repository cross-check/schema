import { Dict, Option } from "ts-std";
import formatter, { Schema } from "../formatter";
import { isRequired } from "../label";
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

  pushSubType(): void {
    let typeName = `${this.currentName}_${this.key}`;
    this.push(typeName);
    this.pushType(typeName);
    this.key = null;
  }

  doneType(): void {
    this.push("}");
    let type = this.types.pop();
    this.finished.push(type!);
  }

  done(): string {
    return this.finished.map(f => f.done()).join("\n\n");
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
  closeValue({ buffer, optionality, position }): void {
    buffer.doneValue(isRequired(position, optionality));
  },

  openList({ buffer }): void {
    buffer.push("[");
  },
  closeList({ buffer }): void {
    buffer.push("!]");
  },

  emitPrimitive({ label, buffer, options }): void {
    buffer.push(`${options.scalarMap[label.type.schemaType.name]}`);
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
