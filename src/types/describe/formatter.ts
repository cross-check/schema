import { SchemaReporter } from "./default";
import { DictionaryLabel, Optionality } from "./label";
import { Accumulator, Position, Reporter, ReporterDelegate } from "./reporter";
import { StringVisitor } from "./visitor";

export type Formatter<Options = void, Result = string> = Options extends void
  ? (schema: Schema) => Result
  : (schema: Schema, options: Options) => Result;

export interface Schema {
  name: string;
  label: DictionaryLabel;
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
    let visitor = new StringVisitor<Buffer, string, typeof options>(reporter);

    return visitor.dictionary(
      {
        type: schema.label,
        optionality: Optionality.None
      },
      Position.WholeSchema
    );
  }) as any;
}
