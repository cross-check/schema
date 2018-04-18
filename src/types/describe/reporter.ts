import { assert } from "ts-std";
import { Label, Optionality } from "./label";

export class Buffer {
  constructor(private buf: string = "") {}

  push(s: string) {
    this.buf += s;
  }

  toString(): string {
    return this.buf;
  }
}

export class Reporter {
  private buffer = new Buffer();
  private stack: ReporterState[] = [];
  private pad = 0;

  constructor(State: ReporterStateConstructor) {
    this.stack.push(new State(this.buffer, this.pad, this.stack));
  }

  finish(): string {
    return this.buffer.toString();
  }

  get state(): ReporterState {
    assert(this.stack.length > 0, "Cannot get state from an empty stack");
    return this.stack[this.stack.length - 1];
  }

  startDictionary(): void {
    ifHasEvent(this.state, "startDictionary", state => {
      state.startDictionary();
    });
  }

  addKey(name: string, optionality: Optionality): void {
    ifHasEvent(this.state, "addKey", state => {
      state.addKey(name, optionality);
    });
  }

  endDictionary(): void {
    ifHasEvent(this.state, "endDictionary", state => {
      state.endDictionary();
    });
  }

  primitiveValue(type: Label): void {
    ifHasEvent(this.state, "primitiveValue", state => {
      state.primitiveValue(type);
    });
  }

  startListValue(): void {
    ifHasEvent(this.state, "startListValue", state => {
      state.startListValue();
    });
  }

  endListValue(): void {
    ifHasEvent(this.state, "endListValue", state => {
      state.endListValue();
    });
  }
}

export interface ReporterStateConstructor {
  new (buffer: Buffer, pad: number, stack: ReporterState[]): ReporterState;
}

export abstract class ReporterState {
  constructor(
    protected buffer: Buffer,
    protected pad: number,
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

  startDictionary?(): void;
  addKey?(key: string, optionality: Optionality): void;
  endDictionary?(): void;
  startListValue?(): void;
  listValue?(
    description: string,
    typescript: string,
    optionality: Optionality
  ): void;
  endListValue?(): void;
  startTuple?(): void;
  endTuple?(): void;
  startGeneric?(name: string): void;
  endGeneric?(): void;
  primitiveValue?(type: Label): void;
}

function ifHasEvent<K extends keyof ReporterState>(
  state: ReporterState,
  name: K,
  callback: (state: ReporterState & Required<Pick<ReporterState, K>>) => void
): void {
  if (hasEvent(state, name)) {
    callback(state);
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
