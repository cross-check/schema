import { assert } from "ts-std";
import { Label, Optionality, PrimitiveLabel } from "./label";

export class Buffer {
  constructor(private buf: string = "") {}

  push(s: string) {
    this.buf += s;
  }

  toString(): string {
    return this.buf;
  }
}

export interface Reporters {
  Value: ReporterStateConstructor;
  Structure: ReporterStateConstructor;
  List: ReporterStateConstructor;
}

export interface State {
  buffer: Buffer;
  padding: number;
}

export interface ReporterDelegate {
  structure: {
    startKey(
      key: string,
      position: Position,
      optionality: Optionality,
      state: State
    ): string | void;
    closeValue(position: Position, state: State): void;
    closeDictionary(
      position: Position,
      opotionality: Optionality,
      state: State
    ): void;
  };

  list: {
    openDictionary(position: Position, state: State): void;
    closeList(position: Position, state: State): void;
  };

  value: {
    openDictionary(position: Position, state: State): void;
    closeDictionary(position: Position, state: State): void;
    openList(position: Position, state: State): void;
    primitiveValue(label: Label<PrimitiveLabel>, state: State): void;
  };
}

export class Reporter {
  private buffer = new Buffer();
  private stack: ReporterState[] = [];
  private pad = 0;

  constructor(State: ReporterStateConstructor, reporters: ReporterDelegate) {
    this.stack.push(new State(this.buffer, this.pad, this.stack, reporters));
  }

  finish(): string {
    return this.buffer.toString();
  }

  get state(): ReporterState {
    assert(this.stack.length > 0, "Cannot get state from an empty stack");
    return this.stack[this.stack.length - 1];
  }

  startDictionary(position: Position): void {
    ifHasEvent(this.state, "startDictionary", state => {
      state.startDictionary(position);
    });
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

  startPrimitiveValue(position: Position): void {
    ifHasEvent(this.state, "startPrimitiveValue", state => {
      state.startPrimitiveValue(position);
    });
  }

  endPrimitiveValue(position: Position): void {
    let repeat: true | void = true;

    while (repeat) {
      repeat = ifHasEvent(this.state, "endPrimitiveValue", state => {
        return state.endPrimitiveValue(position);
      });
    }
  }

  primitiveValue(type: Label): void {
    ifHasEvent(this.state, "primitiveValue", state => {
      state.primitiveValue(type);
    });
  }

  startListValue(position: Position): void {
    ifHasEvent(this.state, "startListValue", state => {
      state.startListValue(position);
    });
  }

  endListValue(position: Position): void {
    let repeat: true | void = true;

    while (repeat) {
      repeat = ifHasEvent(this.state, "endListValue", state => {
        return state.endListValue(position);
      });
    }
  }
}

export interface ReporterStateConstructor {
  new (
    buffer: Buffer,
    pad: number,
    stack: ReporterState[],
    reporters: ReporterDelegate
  ): ReporterState;
}

export enum Position {
  First,
  Last,
  Middle,
  WholeSchema,
  Only
}
export abstract class ReporterState {
  constructor(
    protected buffer: Buffer,
    protected padding: number,
    protected stack: ReporterState[]
  ) {}

  debug(): void {
    // tslint:disable-next-line:no-console
    console.group("So far");
    // tslint:disable-next-line:no-console
    console.log(this.buffer.toString());
    // tslint:disable-next-line:no-console
    console.groupEnd();

    // tslint:disable-next-line:no-console
    console.group("State stack");
    for (let item of this.stack) {
      // tslint:disable-next-line:no-console
      console.log(item.constructor.name);
    }
    // tslint:disable-next-line:no-console
    console.groupEnd();
  }

  startDictionary?(position: Position): void;
  addKey?(key: string, position: Position, optionality: Optionality): void;
  endDictionary?(position: Position, optionality: Optionality): true | void;
  startListValue?(position: Position): void;
  listValue?(
    description: string,
    typescript: string,
    optionality: Optionality
  ): void;
  endListValue?(position: Position): true | void;
  startTuple?(position: Position): void;
  endTuple?(position: Position): true | void;
  startGeneric?(name: string): void;
  endGeneric?(): true | void;
  startPrimitiveValue?(position: Position): void;
  primitiveValue?(type: Label): void;
  endPrimitiveValue?(position: Position): true | void;

  protected state(): State {
    return {
      padding: this.padding,
      buffer: this.buffer
    };
  }
}

export abstract class AbstractReporterState extends ReporterState {
  constructor(
    buffer: Buffer,
    pad: number,
    stack: ReporterState[],
    protected reporters: ReporterDelegate
  ) {
    super(buffer, pad, stack);
  }
}

function ifHasEvent<
  K extends keyof ReporterState,
  C extends (state: ReporterState & Required<Pick<ReporterState, K>>) => any
>(state: ReporterState, name: K, callback: C): ReturnType<C> {
  if (hasEvent(state, name)) {
    return callback(state);
  } else {
    state.debug();
    throw new Error(
      `Unimplemented ${name} event in ${
        state.constructor.name
      } (could be a bug)`
    );
  }
}

function hasEvent<K extends keyof ReporterState>(
  state: ReporterState,
  key: K
): state is ReporterState & Required<Pick<ReporterState, K>> {
  return key in state && typeof (state as any)[key] === "function";
}
