import { Buffer as StringBuffer } from "./buffer";
import {
  Label,
  NamedLabel,
  Optionality,
  PointerLabel,
  PrimitiveLabel
} from "./label";
import { Position, ReporterState } from "./reporter";

function pushStrings<Buffer, Inner>(value: Inner | void, buffer: Buffer): void {
  if (buffer instanceof StringBuffer && typeof value === "string") {
    buffer.push(value);
  }
}

export class SchemaReporter<Buffer, Inner, Options> extends ReporterState<
  Buffer,
  Inner,
  Options
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

export class StructureReporter<Buffer, Inner, Options> extends ReporterState<
  Buffer,
  Inner,
  Options
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
          buffer: this.buffer,
          options: this.options
        }),
        this.buffer
      );
    } else {
      pushStrings(
        this.reporters.openDictionary({
          position,
          options: this.options,
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
        options: this.options,
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
  endListValue(position: Position, optionality: Optionality): void {
    pushStrings(
      this.reporters.closeValue({
        position,
        optionality,
        options: this.options,
        nesting: this.nesting,
        buffer: this.buffer
      }),
      this.buffer
    );
  }

  /**
   * The current value was a reference, and it is done.
   *
   * Stack:
   *   ..., Structure ->
   *   ..., Structure
   * Calls:
   *   structure#closeValue
   */
  endReferenceValue(position: Position, label: Label<PointerLabel>): void {
    pushStrings(
      this.reporters.closeValue({
        position,
        optionality: label.optionality,
        options: this.options,
        nesting: this.nesting,
        buffer: this.buffer
      }),
      this.buffer
    );
  }

  /**
   * The current value was a reference, and it is done.
   *
   * Stack:
   *   ..., Structure ->
   *   ..., Structure
   * Calls:
   *   structure#closeValue
   */
  endNamedValue(position: Position, optionality: Optionality): void {
    pushStrings(
      this.reporters.closeValue({
        position,
        optionality,
        options: this.options,
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
  endPrimitiveValue(position: Position, optionality: Optionality): void {
    pushStrings(
      this.reporters.closeValue({
        position,
        optionality,
        options: this.options,
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
          options: this.options,
          buffer: this.buffer
        }),
        this.buffer
      );
    } else {
      pushStrings(
        this.reporters.closeDictionary({
          position,
          optionality,
          options: this.options,
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
          optionality,
          options: this.options,
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

export class GenericReporter<Buffer, Inner, Options> extends ReporterState<
  Buffer,
  Inner,
  Options
> {
  /**
   * The generic contains a primitive value.
   *
   * Stack:
   *   ..., Generic ->
   *   ..., Generic, Value
   * Calls:
   *   None
   */
  startPrimitiveValue(): void {
    this.push(ValueReporter);
  }

  startNamedValue(): void {
    this.push(ValueReporter);
  }

  /**
   * The generic contains a dictionary.
   *
   * Stack:
   *   ..., Generic ->
   *   ..., Generic, Structure (and repeat)
   * Calls:
   *   None
   */
  startDictionary(): true {
    this.push(StructureReporter);
    return true;
  }

  /**
   * The generic contains a dictionary.
   *
   * Stack:
   *   ..., Value, Generic ->
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
   *   generic#closeList
   */
  endListValue(position: Position, optionality: Optionality): true {
    pushStrings(
      this.reporters.closeList({
        position,
        optionality,
        options: this.options,
        nesting: this.nesting,
        buffer: this.buffer
      }),
      this.buffer
    );

    this.pop();
    assertTop(this.getStack(), ValueReporter);
    return true;
  }

  endReferenceValue(): true {
    this.pop();
    assertTop(this.getStack(), ValueReporter);
    return true;
  }

  /**
   * The named value has finished.
   *
   * Stack:
   *   ..., Value, List ->
   *   ..., Value (and repeat)
   * Calls:
   *   generic#closeList
   */
  endNamedValue(): true {
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
export class ValueReporter<Buffer, Inner, Options> extends ReporterState<
  Buffer,
  Inner,
  Options
> {
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
        options: this.options,
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
        options: this.options,
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
    this.push(GenericReporter);
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
    assertTop(this.getStack(), GenericReporter, StructureReporter);

    return true;
  }

  /**
   * The value is a Reference.
   *
   * Stack:
   *   ..., Value ->
   *   ..., Value
   * Calls:
   *   value#openReference
   */
  startReferenceValue(position: Position, label: Label<PointerLabel>): void {
    pushStrings(
      this.reporters.openReference({
        position,
        label,
        options: this.options,
        nesting: this.nesting,
        buffer: this.buffer
      }),
      this.buffer
    );
    this.push(GenericReporter);
  }

  /**
   * The value was a reference and is done.
   *
   * Stack:
   *   ..., Structure, Value ->
   *   ..., Structure (and repeat)
   * Calls:
   *   None
   */
  endReferenceValue(): true {
    this.pop();
    assertTop(this.getStack(), StructureReporter);

    return true;
  }

  /**
   * The value is a Named Type.
   *
   * Stack:
   *   ..., Value ->
   *   ..., Value
   * Calls:
   *   None
   */
  startNamedValue(): void {
    /* noop */
  }

  /**
   * The value was a named value.
   *
   * Stack:
   *   ..., Structure, Value ->
   *   ..., Structure (and repeat)
   * Calls:
   *   None
   */
  endNamedValue(): void {
    this.pop();
    assertTop(this.getStack(), StructureReporter, GenericReporter);
  }

  namedValue(label: NamedLabel): void {
    pushStrings(
      this.reporters.emitNamedType({
        label,
        options: this.options,
        buffer: this.buffer,
        nesting: this.nesting
      }),
      this.buffer
    );
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

function assertTop<Buffer, Inner, Options>(
  stack: Array<ReporterState<Buffer, Inner, Options>>,
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
