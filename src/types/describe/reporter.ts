import { assert, unknown } from "ts-std";
import { Buffer as StringBuffer } from "./buffer";
import {
  DictionaryLabel,
  GenericLabel,
  Label,
  NamedLabel,
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
    label: Label<GenericLabel>;
    options: Options;
    buffer: Buffer;
    nesting: number;
  }): Inner | void;
  closeGeneric(options: {
    position: Position;
    label: Label<GenericLabel>;
    options: Options;
    buffer: Buffer;
    nesting: number;
  }): Inner | void;
  emitPrimitive(options: {
    label: Label<PrimitiveLabel>;
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
    label: NamedLabel;
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

  handleEvent<
    K extends keyof ReporterState<Buffer, Inner, Options>,
    L extends Label
  >(name: K, debugArgs: string, position: Position, label: L) {
    let repeat: true | void = true;

    while (repeat) {
      repeat = ifHasEvent(this.state, name, debugArgs, state => {
        return (state[name] as any)(position, label);
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
    this.stack.push(new StateClass(this.state, this.stack, this.reporters));
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

    return;
    // @ts-ignore
    console.log(`<- nesting: ${this.state.nesting}`);

    let buffer = this.state.buffer;

    // prettier-ignore
    console.log(
      (buffer instanceof StringBuffer
        // @ts-ignore 
        ? buffer.done()
        : JSON.stringify(this.state.buffer)
      ).replace(/\n/g, "\\n\n")
    );
    console.groupEnd();
    // tslint:enable:no-console
  }

  debugEnd() {
    // tslint:disable:no-console
    console.log("-> State", debugStack(this.stack));

    console.groupEnd();
    // tslint:enable:no-console
  }

  startDictionary?(
    position: Position,
    label: Label<DictionaryLabel>
  ): true | void;

  startSchema?(position: Position, label: Label<DictionaryLabel>): true | void;

  addKey?(
    key: string,
    position: Position,
    optionality: Optionality
  ): true | void;

  endValue?(position: Position, label: Label): true | void;

  endDictionary?(
    position: Position,
    label: Label<DictionaryLabel>
  ): true | void;

  endSchema?(position: Position, label: Label<DictionaryLabel>): true | void;

  startGenericValue?(
    position: Position,
    label: Label<GenericLabel>
  ): true | void;
  endGenericValue?(position: Position, label: Label<GenericLabel>): true | void;

  startPrimitiveValue?(
    position: Position,
    label: Label<PrimitiveLabel>
  ): true | void;
  primitiveValue?(position: Position, label: Label<PrimitiveLabel>): void;
  endPrimitiveValue?(
    position: Position,
    label: Label<PrimitiveLabel>
  ): true | void;

  startNamedValue?(position: Position, label: NamedLabel): void;
  namedValue?(position: Position, type: NamedLabel): void;
  endNamedValue?(position: Position, label: NamedLabel): true | void;
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
