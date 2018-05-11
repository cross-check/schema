import { LabelledType, NamedType, Type } from "../fundamental/value";
import {
  DictionaryLabel,
  GenericLabel,
  Optionality,
  PrimitiveLabel
} from "./label";
import { Position, ReporterState } from "./reporter";

export class StructureReporter<Buffer, Inner, Options> extends ReporterState<
  Buffer,
  Inner,
  Options
> {
  startDictionaryBody(): void {
    this.push(StructureBodyReporter);
  }

  endDictionary(position: Position, { isRequired }: Type): void {
    this.state.nesting -= 1;

    this.pushStrings(
      this.reporters.closeDictionary({
        position,
        optionality: isRequired ? Optionality.Required : Optionality.Optional,
        ...this.state
      })
    );

    this.pop();
    assertTop(this.getStack(), ValueReporter);
  }
}

export class SchemaReporter<Buffer, Inner, Options> extends ReporterState<
  Buffer,
  Inner,
  Options
> {
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

  startDictionaryBody(): void {
    this.push(StructureBodyReporter);
  }
}

export class StructureBodyReporter<
  Buffer,
  Inner,
  Options
> extends ReporterState<Buffer, Inner, Options> {
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
  }

  endDictionaryBody(): void {
    this.pop();
    assertTop(this.getStack(), StructureReporter, SchemaReporter);
  }
}

export class KeyValueReporter<Buffer, Inner, Options> extends ReporterState<
  Buffer,
  Inner,
  Options
> {
  endValue(position: Position, { isRequired }: Type): void {
    this.pushStrings(
      this.reporters.closeValue({
        position,
        optionality: isRequired ? Optionality.Required : Optionality.Optional,
        ...this.state
      })
    );

    this.pop();
    assertTop(this.getStack(), StructureBodyReporter);
  }
}

export class GenericReporter<Buffer, Inner, Options> extends ReporterState<
  Buffer,
  Inner,
  Options
> {
  endGenericValue(position: Position, type: LabelledType<GenericLabel>): void {
    this.pushStrings(
      this.reporters.closeGeneric({
        position,
        type,
        ...this.state
      })
    );

    this.pop();
    assertTop(this.getStack(), ValueReporter);
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
  startDictionary(
    position: Position,
    type: LabelledType<DictionaryLabel>
  ): void {
    this.state.nesting += 1;

    this.pushStrings(
      this.reporters.openDictionary({
        position,
        ...this.state
      })
    );

    this.push(StructureReporter);
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

    this.push(GenericReporter);
  }

  startTemplatedValue(): true | void {
    this.push(TemplatedValueReporter);
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

  namedValue(_position: Position, type: NamedType): void {
    this.pushStrings(
      this.reporters.emitNamedType({
        type,
        ...this.state
      })
    );
  }
}

export class TemplatedValueReporter<
  Buffer,
  Inner,
  Options
> extends ValueReporter<Buffer, Inner, Options> {
  endTemplatedValue(position: Position, type: LabelledType): void {
    this.pushStrings(
      this.reporters.closeTemplatedValue({
        type,
        position,
        ...this.state
      })
    );

    this.pop();
    assertTop(this.getStack(), ValueReporter);
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
