import { SchemaReporter } from "./default";
import { DictionaryLabel, Label, Optionality } from "./label";
import { Accumulator, Position, Reporter, ReporterDelegate } from "./reporter";
import { StringVisitor } from "./visitor";

export type Formatter<Options = void, Result = string> = Options extends void
  ? (schema: Schema) => Result
  : (schema: Schema, options: Options) => Result;

export interface Schema {
  name: string;
  label: Label<DictionaryLabel>;
}

export default function formatter<Buffer extends Accumulator<string>, Options>(
  delegate: ReporterDelegate<Buffer, string, Options>,
  BufferClass: { new (): Buffer }
): Formatter<Options, string> {
  return ((schema: Schema, options?: Options): string => {
    let reporter = new Reporter<Buffer, string, typeof options>(
      SchemaReporter,
      delegate,
      options,
      new BufferClass()
    );
    let visitor = StringVisitor.build<Buffer, string, typeof options>(reporter);

    return visitor.dictionary(
      {
        type: schema.label.type,
        optionality: Optionality.None
      },
      Position.WholeSchema
    );
  }) as any;
}
