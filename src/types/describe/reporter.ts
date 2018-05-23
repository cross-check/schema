import { LabelledType, Type } from "../fundamental/value";
import { Buffer as StringBuffer } from "./buffer";
import { DictionaryLabel, GenericLabel, PrimitiveLabel } from "./label";

export interface Reporters<Buffer, Inner, Options> {
  Value: ReporterStateConstructor<Buffer, Inner, Options>;
  Structure: ReporterStateConstructor<Buffer, Inner, Options>;
  List: ReporterStateConstructor<Buffer, Inner, Options>;
}

export interface State<Buffer> {
  buffer: Buffer;
  nesting: number;
}

export interface ReporterDelegate<Buffer, Inner, Options> {
  openSchema(options: {
    buffer: Buffer;
    options: Options;
    nesting: number;
  }): Inner | void;
  closeSchema(options: {
    buffer: Buffer;
    options: Options;
    nesting: number;
  }): Inner | void;
  emitKey(options: {
    key: string;
    position: Position;
    required: boolean;
    options: Options;
    buffer: Buffer;
    nesting: number;
  }): Inner | void;
  closeValue(options: {
    position: Position;
    required: boolean;
    options: Options;
    buffer: Buffer;
    nesting: number;
  }): Inner | void;
  openDictionary(options: {
    position: Position;
    options: Options;
    buffer: Buffer;
    nesting: number;
  }): Inner | void;
  closeDictionary(options: {
    position: Position;
    required: boolean;
    options: Options;
    buffer: Buffer;
    nesting: number;
  }): Inner | void;
  openGeneric(options: {
    position: Position;
    type: LabelledType<GenericLabel>;
    options: Options;
    buffer: Buffer;
    nesting: number;
  }): Inner | void;
  closeGeneric(options: {
    position: Position;
    type: LabelledType<GenericLabel>;
    options: Options;
    buffer: Buffer;
    nesting: number;
  }): Inner | void;
  emitPrimitive(options: {
    type: LabelledType<PrimitiveLabel>;
    position: Position;
    options: Options;
    buffer: Buffer;
    nesting: number;
  }): Inner | void;
  emitNamedType(options: {
    type: LabelledType;
    options: Options;
    buffer: Buffer;
    nesting: number;
  }): Inner | void;
}

export interface Accumulator<Inner> {
  done(): Inner;
}

export class Reporter<Buffer extends Accumulator<Inner>, Inner, Options> {
  private state: { buffer: Buffer; nesting: number; options: Options };

  constructor(
    private reporters: ReporterDelegate<Buffer, Inner, Options>,
    options: Options,
    buffer: Buffer
  ) {
    this.state = { buffer, nesting: 0, options };
  }

  finish(): Inner {
    return this.state.buffer.done();
  }

  pushStrings(value: Inner | void) {
    let { buffer } = this.state;

    if (buffer instanceof StringBuffer && typeof value === "string") {
      buffer.push(value);
    }
  }

  startDictionary(position: Position): void {
    this.state.nesting += 1;

    this.pushStrings(
      this.reporters.openDictionary({
        position,
        ...this.state
      })
    );
  }

  endDictionary(position: Position, { isRequired }: Type): void {
    this.state.nesting -= 1;

    this.pushStrings(
      this.reporters.closeDictionary({
        position,
        required: isRequired,
        ...this.state
      })
    );
  }

  startSchema(): void {
    this.state.nesting += 1;

    this.pushStrings(
      this.reporters.openSchema({
        ...this.state
      })
    );
  }

  endSchema(): void {
    this.pushStrings(
      this.reporters.closeSchema({
        ...this.state
      })
    );
  }

  addKey(key: string, position: Position, { isRequired }: LabelledType): void {
    this.pushStrings(
      this.reporters.emitKey({
        key,
        position,
        required: isRequired,
        ...this.state
      })
    );
  }

  endValue(position: Position, { isRequired }: Type): void {
    this.pushStrings(
      this.reporters.closeValue({
        position,
        required: isRequired,
        ...this.state
      })
    );
  }

  endGenericValue(position: Position, type: LabelledType<GenericLabel>): void {
    this.pushStrings(
      this.reporters.closeGeneric({
        position,
        type,
        ...this.state
      })
    );
  }

  startGenericValue(
    position: Position,
    type: LabelledType<GenericLabel>
  ): void {
    this.pushStrings(
      this.reporters.openGeneric({
        position,
        type,
        ...this.state
      })
    );
  }

  primitiveValue(position: Position, type: LabelledType<PrimitiveLabel>): void {
    this.pushStrings(
      this.reporters.emitPrimitive({
        type,
        position,
        ...this.state
      })
    );
  }

  namedValue(_position: Position, type: LabelledType): void {
    this.pushStrings(
      this.reporters.emitNamedType({
        type,
        ...this.state
      })
    );
  }
}

export interface ReporterStateConstructor<Buffer, Inner, Options> {
  new (
    state: { buffer: Buffer; nesting: number; options: Options },
    reporters: ReporterDelegate<Buffer, Inner, Options>
  ): ReporterState<Buffer, Inner, Options>;
}

export enum Position {
  First,
  Last,
  Middle,
  Only,
  ListItem,
  PointerItem,
  IteratorItem,
  WholeSchema,
  Any
}

export function genericPosition(name: GenericLabel["kind"]): Position {
  switch (name) {
    case "iterator":
      return Position.IteratorItem;
    case "pointer":
      return Position.PointerItem;
    case "list":
      return Position.ListItem;
  }
}

export type DictPosition = Position.First | Position.Middle | Position.Last;

export function isDictPosition(position: Position): position is DictPosition {
  return (
    position === Position.First ||
    position === Position.Middle ||
    position === Position.Last
  );
}

export interface InnerState<Buffer, Options> {
  buffer: Buffer;
  nesting: number;
  options: Options;
}

export abstract class ReporterState<Buffer, Inner, Options> {
  constructor(
    protected state: InnerState<Buffer, Options>,
    protected reporters: ReporterDelegate<Buffer, Inner, Options>
  ) {}

  pushStrings(value: Inner | void) {
    let { buffer } = this.state;

    if (buffer instanceof StringBuffer && typeof value === "string") {
      buffer.push(value);
    }
  }

  debug(operation: string): void {
    // tslint:disable:no-console
    console.group(`${operation}`);

    // return;
    // @ts-ignore
    console.log(`<- nesting: ${this.state.nesting}`);

    let buffer = this.state.buffer as { done?(): string };

    if (typeof buffer.done === "function") {
      console.log(buffer.done().replace(/\n/g, "\\n\n"));
    } else {
      console.log(JSON.stringify(this.state.buffer).replace(/\n/g, "\\n\n"));
    }

    console.groupEnd();
    // tslint:enable:no-console
  }

  debugEnd() {
    // tslint:disable:no-console
    console.groupEnd();
    // tslint:enable:no-console
  }

  enter(): void {
    /* noop */
  }

  exit(): void {
    /* noop */
  }

  startDictionary?(
    position: Position,
    type: LabelledType<DictionaryLabel>
  ): true | void;

  startSchema?(
    position: Position,
    type: LabelledType<DictionaryLabel>
  ): true | void;

  addKey?(key: string, position: Position, required: boolean): true | void;

  endValue?(position: Position, type: LabelledType): true | void;

  endDictionary?(
    position: Position,
    type: LabelledType<DictionaryLabel>
  ): true | void;

  endDictionaryBody?(
    position: Position,
    type: LabelledType<DictionaryLabel>
  ): true | void;

  endSchema?(
    position: Position,
    type: LabelledType<DictionaryLabel>
  ): true | void;

  startGenericValue?(
    position: Position,
    type: LabelledType<GenericLabel>
  ): true | void;
  endGenericValue?(
    position: Position,
    type: LabelledType<GenericLabel>
  ): true | void;

  primitiveValue?(position: Position, type: LabelledType<PrimitiveLabel>): void;
  namedValue?(position: Position, type: LabelledType): void;

  startType?(position: Position, type: LabelledType): void;
  endType?(position: Position, type: LabelledType): true | void;

  startTemplatedValue?(position: Position, type: LabelledType): void;
  endTemplatedValue?(position: Position, typed: LabelledType): true | void;
}
