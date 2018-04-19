import {
  DictionaryLabel,
  Label,
  Optionality,
  PrimitiveLabel,
  Visitor
} from "./label";
import { Buffer, Position, Reporter, ReporterState } from "./reporter";

export function schemaFormat(schema: DictionaryLabel): string {
  let reporter = new Reporter(ValueReporter);
  let visitor = new Visitor(reporter);

  return visitor.dictionary(
    { type: schema, optionality: Optionality.None },
    Position.WholeSchema
  );
}

export class StructureReporter extends ReporterState {
  addKey(key: string, _position: Position, _optionality: Optionality): void {
    this.buffer.push(`${padding(this.pad * 2)}${key}: `);
    this.stack.push(new ValueReporter(this.buffer, this.pad, this.stack));
  }

  endListValue(position: Position): void {
    endDictValue(this.buffer, position);
  }

  endPrimitiveValue(position: Position): void {
    endDictValue(this.buffer, position);
  }

  endDictionary(position: Position, optionality: Optionality): true {
    this.pad -= 1;

    if (position === Position.WholeSchema) {
      this.buffer.push(`${padding(this.pad * 2)}}`);
    } else {
      this.buffer.push(`${padding(this.pad * 2)}})`);

      if (optionality === Optionality.Required) {
        this.buffer.push(".required()");
      }
    }

    this.stack.pop();
    return true;
  }
}

function endDictValue(buffer: Buffer, position: Position) {
  if (position === Position.First || position === Position.Middle) {
    buffer.push(",\n");
  } else if (position === Position.Last) {
    buffer.push("\n");
  }
}

export class ListReporter extends ReporterState {
  startPrimitiveValue(): void {
    /* noop */
  }

  startDictionary(position: Position): void {
    if (position === Position.WholeSchema) {
      this.buffer.push(`{\n`);
    } else {
      this.buffer.push(`Dictionary({\n`);
    }

    this.pad += 1;
    this.stack.push(new StructureReporter(this.buffer, this.pad, this.stack));
  }

  endDictionary(): void {
    /* noop */
  }

  endListValue(): true {
    this.buffer.push(")");
    this.stack.pop();

    return true;
  }

  endPrimitiveValue(): void {
    /* noop */
  }

  primitiveValue(label: Label<PrimitiveLabel>): void {
    this.buffer.push(`${formatType(label)}`);
  }
}

export class ValueReporter extends ReporterState {
  startPrimitiveValue(): void {
    /* noop */
  }

  startDictionary(position: Position): void {
    if (position === Position.WholeSchema) {
      this.buffer.push(`{\n`);
    } else {
      this.buffer.push(`Dictionary({\n`);
    }
    this.pad += 1;
    this.stack.push(new StructureReporter(this.buffer, this.pad, this.stack));
  }

  endDictionary(position: Position): void {
    this.buffer.push(position === Position.WholeSchema ? "" : ",\n");
    this.stack.pop();
  }

  startListValue(): void {
    this.buffer.push("List(");
    this.stack.push(new ListReporter(this.buffer, this.pad, this.stack));
  }

  endListValue(): true {
    this.stack.pop();

    return true;
  }

  endPrimitiveValue(): true {
    this.stack.pop();

    return true;
  }

  primitiveValue(label: Label<PrimitiveLabel>): void {
    this.buffer.push(formatType(label));
  }
}

function formatType(label: Label<PrimitiveLabel>) {
  let { name, args } = label.type.schemaType;
  let out = `${name}(${args.join(", ")})`;

  if (label.optionality === Optionality.Required) {
    out += `.required()`;
  }

  return out;
}

function padding(size: number): string {
  return " ".repeat(size);
}
