import { assert } from "ts-std";
// import { Buffer as StringBuffer } from "./buffer";
import {
  Label,
  NamedLabel,
  Optionality,
  PointerLabel,
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
  openSchema(options: { buffer: Buffer; options: Options }): Inner | void;
  closeSchema(options: { buffer: Buffer; options: Options }): Inner | void;
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
  }): Inner | Buffer | void;
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
  }): Inner | Buffer | void;
  openList(options: {
    position: Position;
    buffer: Buffer;
    nesting: number;
  }): Inner | Buffer | void;
  closeList(options: {
    position: Position;
    optionality: Optionality;
    options: Options;
    buffer: Buffer;
    nesting: number;
  }): Inner | void;
  openReference(options: {
    position: Position;
    label: Label<PointerLabel>;
    options: Options;
    buffer: Buffer;
    nesting: number;
  }): Inner | Buffer | void;
  closeReference(options: {
    position: Position;
    label: Label<PointerLabel>;
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
      new StateClass(this.buffer, this.pad, options, this.stack, reporters)
    );
  }

  finish(): Inner {
    return this.buffer.done();
  }

  get state(): ReporterState<Buffer, Inner, Options> {
    assert(this.stack.length > 0, "Cannot get state from an empty stack");
    return this.stack[this.stack.length - 1];
  }

  startDictionary(position: Position): void {
    let repeat: true | void = true;

    while (repeat) {
      repeat = ifHasEvent(this.state, "startDictionary", state => {
        return state.startDictionary(position);
      });
    }
  }

  addKey(name: string, position: Position, optionality: Optionality): void {
    ifHasEvent(this.state, "addKey", state => {
      state.addKey(name, position, optionality);
    });
  }

  endDictionary(position: Position, optionality: Optionality): void {
    let repeat: true | void = true;

    while (repeat) {
      repeat = ifHasEvent(this.state, "endDictionary", state => {
        return state.endDictionary(position, optionality);
      });
    }
  }

  startPrimitiveValue(position: Position, optionality: Optionality): void {
    ifHasEvent(this.state, "startPrimitiveValue", state => {
      state.startPrimitiveValue(position, optionality);
    });
  }

  endPrimitiveValue(position: Position, optionality: Optionality): void {
    let repeat: true | void = true;

    while (repeat) {
      repeat = ifHasEvent(this.state, "endPrimitiveValue", state => {
        return state.endPrimitiveValue(position, optionality);
      });
    }
  }

  primitiveValue(type: Label<PrimitiveLabel>): void {
    ifHasEvent(this.state, "primitiveValue", state => {
      state.primitiveValue(type);
    });
  }

  startNamedValue(position: Position, optionality: Optionality): void {
    ifHasEvent(this.state, "startNamedValue", state => {
      state.startNamedValue(position, optionality);
    });
  }

  endNamedValue(position: Position, optionality: Optionality): void {
    let repeat: true | void = true;

    while (repeat) {
      repeat = ifHasEvent(this.state, "endNamedValue", state => {
        return state.endNamedValue(position, optionality);
      });
    }
  }

  namedValue(type: NamedLabel): void {
    ifHasEvent(this.state, "namedValue", state => {
      state.namedValue(type);
    });
  }

  startListValue(position: Position, optionality: Optionality): void {
    ifHasEvent(this.state, "startListValue", state => {
      state.startListValue(position, optionality);
    });
  }

  endListValue(position: Position, optionality: Optionality): void {
    let repeat: true | void = true;

    while (repeat) {
      repeat = ifHasEvent(this.state, "endListValue", state => {
        return state.endListValue(position, optionality);
      });
    }
  }

  startReferenceValue(position: Position, label: Label<PointerLabel>): void {
    ifHasEvent(this.state, "startReferenceValue", state => {
      state.startReferenceValue(position, label);
    });
  }

  endReferenceValue(position: Position, label: Label<PointerLabel>): void {
    let repeat: true | void = true;

    while (repeat) {
      repeat = ifHasEvent(this.state, "endReferenceValue", state => {
        return state.endReferenceValue(position, label);
      });
    }
  }
}

export interface ReporterStateConstructor<Buffer, Inner, Options> {
  new (
    buffer: Buffer,
    pad: number,
    options: Options,
    stack: Array<ReporterState<Buffer, Inner, Options>>,
    reporters: ReporterDelegate<Buffer, Inner, Options>
  ): ReporterState<Buffer, Inner, Options>;
}

export enum Position {
  First,
  Last,
  Middle,
  WholeSchema,
  Only,
  Any
}
export abstract class ReporterState<Buffer, Inner, Options> {
  constructor(
    protected buffer: Buffer,
    protected nesting: number,
    protected options: Options,
    private stack: Array<ReporterState<Buffer, Inner, Options>>,
    protected reporters: ReporterDelegate<Buffer, Inner, Options>
  ) {}

  getStack(): Array<ReporterState<Buffer, Inner, Options>> {
    return this.stack;
  }

  push(StateClass: ReporterStateConstructor<Buffer, Inner, Options>): void {
    this.debug(`Pushing ${StateClass.name}`);
    this.stack.push(
      new StateClass(
        this.buffer,
        this.nesting,
        this.options,
        this.stack,
        this.reporters
      )
    );
  }

  pop(): void {
    let last = this.stack.pop();
    this.debug(`Popped ${last!.constructor.name}`);
  }

  debug(_operation: string): void {
    /*
    // tslint:disable:no-console
    console.group(`${operation}`);

    console.log(
      "<- State stack",
      this.stack.map(s => s.constructor.name).join(", ")
    );

    console.log(`<- nesting: ${this.nesting}`);

    console.log(
      (this.buffer instanceof StringBuffer
        ? this.buffer.done()
        : JSON.stringify(this.buffer)
      ).replace(/\n/g, "\\n\n")
    );
    console.groupEnd();

    console.groupEnd();
    // tslint:enable:no-console
    */
  }

  startDictionary?(position: Position): void;
  addKey?(key: string, position: Position, optionality: Optionality): void;
  endDictionary?(position: Position, optionality: Optionality): true | void;

  startListValue?(position: Position, optionality: Optionality): void;
  listValue?(
    description: string,
    typescript: string,
    optionality: Optionality
  ): void;
  endListValue?(position: Position, optionality: Optionality): true | void;

  startReferenceValue?(position: Position, label: Label<PointerLabel>): void;
  endReferenceValue?(
    position: Position,
    label: Label<PointerLabel>
  ): true | void;

  startPrimitiveValue?(position: Position, optionality: Optionality): void;
  primitiveValue?(type: Label): void;
  endPrimitiveValue?(position: Position, optionality: Optionality): true | void;

  startNamedValue?(position: Position, optionality: Optionality): void;
  namedValue?(type: NamedLabel): void;
  endNamedValue?(position: Position, optionality: Optionality): true | void;

  protected state(): State<Buffer> {
    return {
      nesting: this.nesting,
      buffer: this.buffer
    };
  }
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
  callback: C
): ReturnType<C> {
  if (hasEvent(state, name)) {
    state.debug(`Dispatching ${name} for ${state.constructor.name}`);
    return callback(state);
  } else {
    state.debug(`Unimplemented ${name}`);
    throw new Error(
      `Unimplemented ${name} event in ${
        state.constructor.name
      } (could be a bug)`
    );
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
