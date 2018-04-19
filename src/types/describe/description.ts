import {
  DictionaryLabel,
  Label,
  Optionality,
  PrimitiveLabel,
  Visitor
} from "./label";
import { Buffer, Position, Reporter, ReporterState } from "./reporter";

export function describe(schema: DictionaryLabel): string {
  let reporter = new Reporter(ValueReporter);
  let visitor = new Visitor(reporter);

  return visitor.dictionary(
    { type: schema, optionality: Optionality.None },
    Position.WholeSchema
  );
}

export class StructureReporter extends ReporterState {
  addKey(key: string, _position: Position, optionality: Optionality): void {
    this.buffer.push(
      `${padding(this.pad * 2)}${formattedKey(key, optionality)}: `
    );

    this.stack.push(new ValueReporter(this.buffer, this.pad, this.stack));
  }

  startPrimitiveValue(): void {
    /* noop */
  }

  endPrimitiveValue(position: Position): void {
    endDictValue(this.buffer, position);
  }

  endListValue(position: Position): void {
    endDictValue(this.buffer, position);
  }

  endDictionary(position: Position) {
    this.pad -= 1;
    this.buffer.push(`${padding(this.pad * 2)}}`);
    endDictValue(this.buffer, position);
    this.stack.pop();
    this.stack.pop();
  }
}

function endDictValue(buffer: Buffer, position: Position) {
  if (position === Position.First || position === Position.Middle) {
    buffer.push(",\n");
  } else if (position === Position.Last) {
    buffer.push("\n");
  }
}

export class ValueReporter extends ReporterState {
  startDictionary(): void {
    this.buffer.push(`{\n`);
    this.pad += 1;
    this.stack.push(new StructureReporter(this.buffer, this.pad, this.stack));
  }

  startPrimitiveValue(): void {
    /* noop */
  }

  endPrimitiveValue(): void {
    /* noop */
  }

  primitiveValue(label: Label<PrimitiveLabel>): void {
    this.buffer.push(`<${label.type.description}>`);
    this.stack.pop();
  }

  startListValue() {
    this.buffer.push(`list of `);
    this.stack.push(new ArrayItemReporter(this.buffer, this.pad, this.stack));
  }

  endListValue(): true {
    this.stack.pop();

    return true;
  }
}

class ArrayItemReporter extends ReporterState {
  startPrimitiveValue(): void {
    /* noop */
  }

  endPrimitiveValue(): void {
    /* noop */
  }

  startDictionary(): void {
    this.buffer.push(`{\n`);
    this.pad += 1;
    this.stack.push(new StructureReporter(this.buffer, this.pad, this.stack));
  }

  primitiveValue(label: Label<PrimitiveLabel>): void {
    this.buffer.push(`<${label.type.description}>`);
    this.stack.pop();
  }
}

function formattedKey(key: string, optionality: Optionality): string {
  if (optionality === Optionality.Optional) {
    return `${key}?`;
  } else {
    return key;
  }
}

function padding(size: number): string {
  return " ".repeat(size);
}
