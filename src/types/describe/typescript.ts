import {
  DictionaryLabel,
  Label,
  Optionality,
  PrimitiveLabel,
  Visitor
} from "./label";
import { Reporter, ReporterState } from "./reporter";

export function typescript(schema: DictionaryLabel): string {
  let reporter = new Reporter(ValueReporter);
  let visitor = new Visitor(reporter);

  return visitor.dictionary(schema);
}

export class StructureReporter extends ReporterState {
  private firstElement = true;

  addKey(key: string, optionality: Optionality): void {
    if (this.firstElement) {
      this.firstElement = false;
    } else {
      this.buffer.push(",\n");
    }

    this.buffer.push(
      `${padding(this.pad * 2)}${formattedKey(key, optionality)}: `
    );

    this.stack.push(new ValueReporter(this.buffer, this.pad, this.stack));
  }

  endDictionary() {
    this.pad -= 1;
    this.buffer.push(`\n${padding(this.pad * 2)}}`);
    this.stack.pop();
    this.stack.pop();
  }
}

export class ValueReporter extends ReporterState {
  startDictionary(): void {
    this.buffer.push(`{\n`);
    this.pad += 1;
    this.stack.push(new StructureReporter(this.buffer, this.pad, this.stack));
  }

  primitiveValue(label: Label<PrimitiveLabel>): void {
    this.buffer.push(`${label.type.typescript}`);
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
