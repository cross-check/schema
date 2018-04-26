import { Label, Optionality, PrimitiveLabel } from "./label";
import {
  AbstractReporterState,
  Buffer,
  Position,
  ReporterState,
  Reporters
} from "./reporter";

export interface ReporterStateConstructor {
  new (
    buffer: Buffer,
    pad: number,
    stack: ReporterState[],
    reporters: Reporters
  ): ReporterState;
}

function pushStrings(value: string | void, buffer: Buffer): void {
  if (typeof value === "string") {
    buffer.push(value);
  }
}

export class StructureReporter extends AbstractReporterState {
  addKey(key: string, position: Position, optionality: Optionality): void {
    pushStrings(
      this.reporters.structure.startKey(
        key,
        position,
        optionality,
        this.state()
      ),
      this.buffer
    );

    this.stack.push(
      new ValueReporter(this.buffer, this.padding, this.stack, this.reporters)
    );
  }

  endListValue(position: Position): void {
    pushStrings(
      this.reporters.structure.closeValue(position, this.state()),
      this.buffer
    );
  }

  endPrimitiveValue(position: Position): void {
    pushStrings(
      this.reporters.structure.closeValue(position, this.state()),
      this.buffer
    );
  }

  endDictionary(position: Position, optionality: Optionality): true | void {
    this.padding -= 1;

    pushStrings(
      this.reporters.structure.closeDictionary(
        position,
        optionality,
        this.state()
      ),
      this.buffer
    );

    this.stack.pop();
    return true;
  }
}

export class ListReporter extends AbstractReporterState {
  startPrimitiveValue(): void {
    this.stack.push(
      new ValueReporter(this.buffer, this.padding, this.stack, this.reporters)
    );
  }

  startDictionary(position: Position): void {
    pushStrings(
      this.reporters.list.openDictionary(position, this.state()),
      this.buffer
    );

    this.padding += 1;
    this.stack.push(
      new StructureReporter(
        this.buffer,
        this.padding,
        this.stack,
        this.reporters
      )
    );
  }

  endDictionary(): void {
    /* noop */
  }

  endListValue(position: Position): true {
    pushStrings(
      this.reporters.list.closeList(position, this.state()),
      this.buffer
    );
    this.stack.pop();
    return true;
  }

  endPrimitiveValue(): void {
    /* noop */
  }
}

export class ValueReporter extends AbstractReporterState {
  startPrimitiveValue(): void {
    /* noop */
  }

  primitiveValue(label: Label<PrimitiveLabel>): void {
    pushStrings(
      this.reporters.value.primitiveValue(label, this.state()),
      this.buffer
    );
  }

  startDictionary(position: Position): void {
    pushStrings(
      this.reporters.value.openDictionary(position, this.state()),
      this.buffer
    );

    this.padding += 1;
    this.stack.push(
      new StructureReporter(
        this.buffer,
        this.padding,
        this.stack,
        this.reporters
      )
    );
  }

  endDictionary(position: Position): void {
    pushStrings(
      this.reporters.value.closeDictionary(position, this.state()),
      this.buffer
    );
    this.stack.pop();
  }

  startListValue(position: Position): void {
    pushStrings(
      this.reporters.value.openList(position, this.state()),
      this.buffer
    );
    this.stack.push(
      new ListReporter(this.buffer, this.padding, this.stack, this.reporters)
    );
  }

  endListValue(): true {
    this.stack.pop();

    return true;
  }

  endPrimitiveValue(): void | true {
    this.stack.pop();

    return true;
  }
}
