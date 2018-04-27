import { Buffer as StringBuffer } from "./buffer";
import { Label, Optionality, PrimitiveLabel } from "./label";
import { Position, ReporterState } from "./reporter";

function pushStrings<Buffer, Inner>(value: Inner | void, buffer: Buffer): void {
  if (buffer instanceof StringBuffer && typeof value === "string") {
    buffer.push(value);
  }
}

export class SchemaReporter<Buffer, Inner> extends ReporterState<
  Buffer,
  Inner
> {
  /**
   * Open the dictionary representing the entire schema.
   *
   * Stack:
   *   Schema ->
   *   Schema, Structure (and repeat)
   * Calls:
   *   None
   */
  startDictionary(): true {
    this.push(StructureReporter);
    return true;
  }

  /**
   * Finish the schema.
   *
   * Stack:
   *   Schema ->
   *   Schema
   * Calls:
   *   None
   */
  endDictionary(): void {
    /* noop: finish the outer dictionary */
  }
}

export class StructureReporter<Buffer, Inner> extends ReporterState<
  Buffer,
  Inner
> {
  /**
   * Open the current dictionary.
   *
   * Stack:
   *   ... ->
   *   ...
   * Calls:
   *   value#openDictionary
   */
  startDictionary(position: Position): void {
    this.nesting += 1;

    if (position === Position.WholeSchema) {
      pushStrings(
        this.reporters.openSchema({
          buffer: this.buffer
        }),
        this.buffer
      );
    } else {
      pushStrings(
        this.reporters.openDictionary({
          position,
          nesting: this.nesting,
          buffer: this.buffer
        }),
        this.buffer
      );
    }
  }

  /**
   * Start a new key in the current dictionary.
   *
   * Stack:
   *   ..., Structure ->
   *   ..., Structure, Value
   * Calls:
   *   structure#emitKey
   */
  addKey(key: string, position: Position, optionality: Optionality): void {
    pushStrings(
      this.reporters.emitKey({
        key,
        position,
        optionality,
        buffer: this.buffer,
        nesting: this.nesting
      }),
      this.buffer
    );

    this.push(ValueReporter);
  }

  /**
   * The current value was a list, and it is done.
   *
   * Stack:
   *   ..., Structure ->
   *   ..., Structure
   * Calls:
   *   structure#closeValue
   */
  endListValue(position: Position): void {
    pushStrings(
      this.reporters.closeValue({
        position,
        nesting: this.nesting,
        buffer: this.buffer
      }),
      this.buffer
    );
  }

  /**
   * The current value was a primitive, and it is done.
   *
   * Stack:
   *   ..., Structure ->
   *   ..., Structure
   * Calls:
   *   structure#closeValue
   */
  endPrimitiveValue(position: Position): void {
    pushStrings(
      this.reporters.closeValue({
        position,
        nesting: this.nesting,
        buffer: this.buffer
      }),
      this.buffer
    );
  }

  /**
   * The current dictionary is finished.
   *
   * Stack:
   *   ..., Structure ->
   *   ... (and repeat)
   * Calls:
   *   structure#closeDictionary
   */
  endDictionary(position: Position, optionality: Optionality): true | void {
    this.nesting -= 1;

    if (position === Position.WholeSchema) {
      pushStrings(
        this.reporters.closeSchema({
          buffer: this.buffer
        }),
        this.buffer
      );
    } else {
      pushStrings(
        this.reporters.closeDictionary({
          position,
          optionality,
          buffer: this.buffer,
          nesting: this.nesting
        }),
        this.buffer
      );
    }

    if (position !== Position.WholeSchema && position !== Position.Only) {
      pushStrings(
        this.reporters.closeValue({
          position,
          buffer: this.buffer,
          nesting: this.nesting
        }),
        this.buffer
      );
    }

    this.pop();
    // assertTop(this.getStack(), ValueReporter, SchemaReporter);
    return true;
  }
}

export class ListReporter<Buffer, Inner> extends ReporterState<Buffer, Inner> {
  /**
   * The list contains a primitive value.
   *
   * Stack:
   *   ..., List ->
   *   ..., List, Value
   * Calls:
   *   None
   */
  startPrimitiveValue(): void {
    this.push(ValueReporter);
  }

  /**
   * The list contains a dictionary.
   *
   * Stack:
   *   ..., List ->
   *   ..., List, Structure (and repeat)
   * Calls:
   *   None
   */
  startDictionary(): true {
    this.push(StructureReporter);
    return true;
  }

  /**
   * The list contains a dictionary.
   *
   * Stack:
   *   ..., Value, List ->
   *   ..., Value (and repeat)
   * Calls:
   *   None
   */
  endDictionary(): void {
    /* noop */
  }

  /**
   * The list value has finished.
   *
   * Stack:
   *   ..., Value, List ->
   *   ..., Value (and repeat)
   * Calls:
   *   list#closeList
   */
  endListValue(position: Position): true {
    pushStrings(
      this.reporters.closeList({
        position,
        nesting: this.nesting,
        buffer: this.buffer
      }),
      this.buffer
    );

    this.pop();
    assertTop(this.getStack(), ValueReporter);
    return true;
  }

  /**
   * The list value was a primitive, and it finished.
   *
   * Stack:
   *   ..., List ->
   *   ..., List
   * Calls:
   *   None
   */
  endPrimitiveValue(): void {
    /* noop */
  }
}

/**
 * Comes from: List or Structure
 */
export class ValueReporter<Buffer, Inner> extends ReporterState<Buffer, Inner> {
  /**
   * The value is a primitive.
   *
   * Stack:
   *   ..., Value ->
   *   ..., Value
   * Calls:
   *   None
   */
  startPrimitiveValue(): void {
    /* noop */
  }

  /**
   * Receive the primitive value.
   *
   * Stack:
   *   ..., Value ->
   *   ..., Value
   * Calls:
   *   value#primitiveValue
   */
  primitiveValue(label: Label<PrimitiveLabel>): void {
    pushStrings(
      this.reporters.emitPrimitive({
        label,
        nesting: this.nesting,
        buffer: this.buffer
      }),
      this.buffer
    );
  }

  /**
   * The value is a dictionary.
   *
   * Stack:
   *   ..., Value ->
   *   ..., Value, Structure
   * Calls:
   *   value#openDictionary
   */
  startDictionary(position: Position): void {
    pushStrings(
      this.reporters.openDictionary({
        position,
        nesting: this.nesting,
        buffer: this.buffer
      }),
      this.buffer
    );

    this.nesting += 1;
    this.push(StructureReporter);
  }

  /**
   * The value was a dictionary and is done.
   *
   * Stack:
   *   ..., Structure, Value ->
   *   ..., Structure
   * Calls:
   *   value#closeValue
   */
  endDictionary(): void {
    this.pop();
    assertTop(this.getStack(), StructureReporter);
  }

  /**
   * The value is a List.
   *
   * Stack:
   *   ..., Value ->
   *   ..., Value, List
   * Calls:
   *   value#openList
   */
  startListValue(position: Position): void {
    pushStrings(
      this.reporters.openList({
        position,
        nesting: this.nesting,
        buffer: this.buffer
      }),
      this.buffer
    );
    this.push(ListReporter);
  }

  /**
   * The value was a list and is done.
   *
   * Stack:
   *   ..., List, Value ->
   *   ..., List (and repeat)
   * Calls:
   *   None
   */
  endListValue(): true {
    this.pop();
    assertTop(this.getStack(), ListReporter, StructureReporter);

    return true;
  }

  /**
   * The value was a primitive and is done.
   *
   * Stack:
   *   ..., Value ->
   *   ... (and repeat)
   * Calls:
   *   None
   */
  endPrimitiveValue(): true {
    this.pop();

    return true;
  }
}

function assertTop<Buffer, Inner>(
  stack: Array<ReporterState<Buffer, Inner>>,
  ...states: Array<typeof ReporterState>
): void {
  let top = stack[stack.length - 1];
  if (states.every(state => top.constructor !== state)) {
    throw new Error(
      `Expected top of stack to be ${states
        .map(s => s.name)
        .join(" or ")}, but got ${top.constructor.name}`
    );
  }
}
