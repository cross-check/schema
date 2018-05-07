import {
  GenericLabel,
  IteratorLabel,
  Label,
  NamedLabel,
  Optionality,
  PrimitiveLabel
} from "./label";
import { Position, ReporterState } from "./reporter";

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
  startSchema(): void {
    this.state.nesting += 1;

    this.pushStrings(
      this.reporters.openSchema({
        ...this.state
      })
    );

    this.push(StructureReporter);
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
  endSchema(): void {
    this.pushStrings(
      this.reporters.closeSchema({
        ...this.state
      })
    );
  }
}

export class KeyValueReporter<Buffer, Inner, Options> extends ReporterState<
  Buffer,
  Inner,
  Options
> {
  endValue(position: Position, label: Label): void {
    this.pushStrings(
      this.reporters.closeValue({
        position,
        optionality: label.optionality,
        ...this.state
      })
    );

    this.pop();
    assertTop(this.getStack(), StructureReporter);
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
  endGenericValue(): void {
    /* noop */
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
  endNamedValue(): void {
    /* noop */
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
  endPrimitiveValue(): void {
    /* noop */
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
    this.state.nesting += 1;

    this.pushStrings(
      this.reporters.openDictionary({
        position,
        ...this.state
      })
    );
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
    this.pushStrings(
      this.reporters.emitKey({
        key,
        position,
        optionality,
        ...this.state
      })
    );

    this.push(KeyValueReporter);
    this.push(ValueReporter);
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
  endDictionary(position: Position, { optionality }: Label): true | void {
    this.state.nesting -= 1;

    this.pushStrings(
      this.reporters.closeDictionary({
        position,
        optionality,
        ...this.state
      })
    );

    this.pop();
    return true;
  }

  endSchema(): true {
    this.pop();
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

  endGenericValue(position: Position, label: Label<IteratorLabel>): void {
    this.pushStrings(
      this.reporters.closeGeneric({
        position,
        label,
        ...this.state
      })
    );
    this.pop();
    assertTop(this.getStack(), ValueReporter);
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
  endNamedValue(): void {
    this.pop();
    assertTop(this.getStack(), ValueReporter);
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
  primitiveValue(_position: Position, label: Label<PrimitiveLabel>): void {
    this.pushStrings(
      this.reporters.emitPrimitive({
        label,
        ...this.state
      })
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
    this.pushStrings(
      this.reporters.openDictionary({
        position,
        ...this.state
      })
    );

    this.state.nesting += 1;
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
    assertTop(this.getStack(), KeyValueReporter);
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
  startGenericValue(position: Position, label: Label<GenericLabel>): void {
    this.pushStrings(
      this.reporters.openGeneric({
        position,
        label,
        ...this.state
      })
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
  endGenericValue(): true {
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

  namedValue(_position: Position, label: NamedLabel): void {
    this.pushStrings(
      this.reporters.emitNamedType({
        label,
        ...this.state
      })
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
  endPrimitiveValue(position: Position, { optionality }: Label): true {
    this.pushStrings(
      this.reporters.endPrimitive({
        position,
        optionality,
        ...this.state
      })
    );

    this.pop();

    return true;
  }

  endValue(): true {
    this.pop();
    assertTop(this.getStack(), KeyValueReporter);
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
