import { SchemaReporter } from "./default";
import { DictionaryLabel, Optionality, StringVisitor } from "./label";
import { Accumulator, Position, Reporter, ReporterDelegate } from "./reporter";

export type Formatter<Result = string> = (
  schema: { label: DictionaryLabel }
) => Result;

export interface HasLabel {
  label: DictionaryLabel;
}
export default function formatter<Buffer extends Accumulator<Inner>, Inner>(
  delegate: ReporterDelegate<Buffer, Inner>,
  BufferClass: { new (): Buffer }
) {
  return (schema: HasLabel): Inner => {
    let reporter = new Reporter<Buffer, Inner>(
      SchemaReporter,
      delegate,
      new BufferClass()
    );
    let visitor = new StringVisitor<Buffer, Inner>(reporter);

    return visitor.dictionary(
      {
        type: schema.label,
        optionality: Optionality.None
      },
      Position.WholeSchema
    );
  };
}
