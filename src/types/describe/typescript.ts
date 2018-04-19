import {
  DictionaryLabel,
  Label,
  Optionality,
  PrimitiveLabel,
  Visitor
} from "./label";
import { Position, Reporter, ReporterState } from "./reporter";

export function typescript(schema: DictionaryLabel): string {
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

  endListValue(): void {
    this.buffer.push(";\n");
  }

  endPrimitiveValue(): void {
    this.buffer.push(";\n");
  }

  endDictionary(): true {
    this.pad -= 1;
    this.buffer.push(`${padding(this.pad * 2)}}`);

    this.stack.pop();
    return true;
  }
}

export class ListReporter extends ReporterState {
  startPrimitiveValue(): void {
    /* noop */
  }

  startDictionary(): void {
    this.buffer.push(`{\n`);
    this.pad += 1;
    this.stack.push(new StructureReporter(this.buffer, this.pad, this.stack));
  }

  endDictionary(): void {
    /* noop */
  }

  endListValue(): true {
    this.buffer.push(">");
    this.stack.pop();

    return true;
  }

  endPrimitiveValue(): void {
    /* noop */
  }

  primitiveValue(label: Label<PrimitiveLabel>): void {
    this.buffer.push(`${label.type.typescript}`);
  }
}

export class ValueReporter extends ReporterState {
  startPrimitiveValue(): void {
    /* noop */
  }

  startDictionary(): void {
    this.buffer.push(`{\n`);
    this.pad += 1;
    this.stack.push(new StructureReporter(this.buffer, this.pad, this.stack));
  }

  endDictionary(position: Position): void {
    this.buffer.push(position === Position.WholeSchema ? "" : ";\n");
    this.stack.pop();
  }

  startListValue(): void {
    this.buffer.push("Array<");
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
    this.buffer.push(`${label.type.typescript}`);
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
