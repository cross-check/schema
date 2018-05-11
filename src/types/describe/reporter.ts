import { assert, unknown } from "ts-std";
import { LabelledType, NamedType, Type } from "../fundamental/value";
import { Buffer as StringBuffer } from "./buffer";
import {
  DictionaryLabel,
  GenericLabel,
  Optionality,
  PrimitiveLabel
} from "./label";

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
    optionality: Optionality;
    options: Options;
    buffer: Buffer;
    nesting: number;
  }): Inner | void;
  closeValue(options: {
    position: Position;
    optionality: Optionality;
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
    optionality: Optionality;
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
  openTemplatedValue(options: {
    position: Position;
    type: LabelledType;
    options: Options;
    buffer: Buffer;
    nesting: number;
  }): Inner | void;
  closeTemplatedValue(options: {
    position: Position;
    type: LabelledType;
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
  endPrimitive(options: {
    position: Position;
    optionality: Optionality;
    options: Options;
    buffer: Buffer;
    nesting: number;
  }): Inner | void;
  emitNamedType(options: {
    type: NamedType;
    options: Options;
    buffer: Buffer;
    nesting: number;
  }): Inner | void;
}

export interface Accumulator<Inner> {
  done(): Inner;
}

export class Reporter<Buffer extends Accumulator<Inner>, Inner, Options> {
  private stack: Array<ReporterState<Buffer, Inner, Options>> = [];
  private pad = 0;

  constructor(
    StateClass: ReporterStateConstructor<Buffer, Inner, Options>,
    private ValueState: ReporterStateConstructor<Buffer, Inner, Options>,
    reporters: ReporterDelegate<Buffer, Inner, Options>,
    options: Options,
    private buffer: Buffer
  ) {
    this.stack.push(
      new StateClass(
        { buffer: this.buffer, nesting: this.pad, options },
        this.stack,
        reporters
      )
    );
  }

  finish(): Inner {
    return this.buffer.done();
  }

  get state(): ReporterState<Buffer, Inner, Options> {
    assert(this.stack.length > 0, "Cannot get state from an empty stack");
    return this.stack[this.stack.length - 1];
  }

  addKey(name: string, position: Position, optionality: Optionality): void {
    this.repeatEvent("addKey", name, state =>
      state.addKey(name, position, optionality)
    );
  }

  startType(): void {
    this.state.push(this.ValueState);
  }

  endType(): void {
    this.state.pop();
  }

  handleEvent<
    K extends keyof ReporterState<Buffer, Inner, Options>,
    T extends Type
  >(name: K, debugArgs: string, position: Position, type: T) {
    let repeat: true | void = true;

    while (repeat) {
      repeat = ifHasEvent(this.state, name, debugArgs, state => {
        return (state[name] as any)(position, type);
      });
    }
  }

  private repeatEvent<
    K extends keyof ReporterState<Buffer, Inner, Options>,
    C extends (
      state: ReporterState<Buffer, Inner, Options> &
        Required<Pick<ReporterState<Buffer, Inner, Options>, K>>
    ) => true | void
  >(name: K, debugArgs: unknown, callback: C) {
    let repeat: true | void = true;

    while (repeat) {
      repeat = ifHasEvent(this.state, name, debugArgs, state => {
        return callback(state);
      });
    }
  }
}

export interface ReporterStateConstructor<Buffer, Inner, Options> {
  new (
    state: { buffer: Buffer; nesting: number; options: Options },
    stack: Array<ReporterState<Buffer, Inner, Options>>,
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
    private stack: Array<ReporterState<Buffer, Inner, Options>>,
    protected reporters: ReporterDelegate<Buffer, Inner, Options>
  ) {}

  getStack(): Array<ReporterState<Buffer, Inner, Options>> {
    return this.stack;
  }

  push(StateClass: ReporterStateConstructor<Buffer, Inner, Options>): void {
    // this.debug(`Pushing ${StateClass.name}`);
    let state = new StateClass(this.state, this.stack, this.reporters);
    this.stack.push(state);
  }

  pop(): void {
    this.stack.pop();
    // this.debug(`Popped ${last!.constructor.name}`);
  }

  pushStrings(value: Inner | void) {
    let { buffer } = this.state;

    if (buffer instanceof StringBuffer && typeof value === "string") {
      buffer.push(value);
    }
  }

  debug(operation: string): void {
    // tslint:disable:no-console
    console.group(`${operation}`);

    console.log("<- State", debugStack(this.stack));

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
    console.log("-> State", debugStack(this.stack));

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

  startDictionaryBody?(
    position: Position,
    type: LabelledType<DictionaryLabel>
  ): true | void;

  startSchema?(
    position: Position,
    type: LabelledType<DictionaryLabel>
  ): true | void;

  addKey?(
    key: string,
    position: Position,
    optionality: Optionality
  ): true | void;

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

  startPrimitiveValue?(
    position: Position,
    type: LabelledType<PrimitiveLabel>
  ): true | void;
  primitiveValue?(position: Position, type: LabelledType<PrimitiveLabel>): void;
  endPrimitiveValue?(
    position: Position,
    type: LabelledType<PrimitiveLabel>
  ): true | void;

  startNamedValue?(position: Position, type: NamedType): void;

  startType?(position: Position, type: LabelledType): void;
  endType?(position: Position, type: LabelledType): true | void;

  namedValue?(position: Position, type: NamedType): void;

  startTemplatedValue?(position: Position, type: LabelledType): void;
  endTemplatedValue?(position: Position, typed: LabelledType): true | void;
}

function ifHasEvent<
  Buffer,
  Inner,
  Options,
  K extends keyof ReporterState<Buffer, Inner, Options>,
  C extends (
    state: ReporterState<Buffer, Inner, Options> &
      Required<Pick<ReporterState<Buffer, Inner, Options>, K>>
  ) => any
>(
  state: ReporterState<Buffer, Inner, Options>,
  name: K,
  debugArgs: unknown,
  callback: C
): ReturnType<C> | void {
  if (hasEvent(state, name)) {
    try {
      state.debug(
        `Dispatching ${name} (${JSON.stringify(debugArgs)}) for ${
          state.constructor.name
        }`
      );
      return callback(state);
    } finally {
      state.debugEnd();
    }
  } else {
    try {
      state.debug(`Unimplemented ${name}`);
      throw new Error(
        `Unimplemented ${name} event in ${
          state.constructor.name
        } (could be a bug)`
      );
    } finally {
      state.debugEnd();
    }
  }
}

function hasEvent<
  Buffer,
  Inner,
  Options,
  K extends keyof ReporterState<Buffer, Inner, Options>
>(
  state: ReporterState<Buffer, Inner, Options>,
  key: K
): state is ReporterState<Buffer, Inner, Options> &
  Required<Pick<ReporterState<Buffer, Inner, Options>, K>> {
  return key in state && typeof (state as any)[key] === "function";
}

function debugStack(states: Array<ReporterState<any, any, any>>) {
  return states
    .map(s => {
      return s.constructor.name.replace(/Reporter$/, "");
    })
    .join(", ");
}
