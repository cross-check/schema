import { ValueReporter } from "./default";
import {
  DictionaryLabel,
  Label,
  Optionality,
  PrimitiveLabel,
  Visitor
} from "./label";
import { Position, Reporter, ReporterDelegate, State } from "./reporter";

export function describe(schema: DictionaryLabel): string {
  let reporter = new Reporter(ValueReporter, delegate);
  let visitor = new Visitor(reporter);

  return visitor.dictionary(
    { type: schema, optionality: Optionality.None },
    Position.WholeSchema
  );
}

const structure: ReporterDelegate["structure"] = {
  startKey(
    key: string,
    position: Position,
    optionality: Optionality,
    state: State
  ): string {
    return `${padding(state.padding * 2)}${formattedKey(key, optionality)}: `;
  },

  closeDictionary(
    position: Position,
    optionality: Optionality,
    state: State
  ): string {
    return `${padding(state.padding * 2)}}`;
  },

  closeValue(position: Position, state: State): string {
    return position === Position.Last ? "\n" : ",\n";
  }
};

const list: ReporterDelegate["list"] = {
  openDictionary(position: Position, state: State): string {
    return `{\n`;
  },

  closeList(position: Position, state: State): void {
    /* noop */
  }
};

const value: ReporterDelegate["value"] = {
  openDictionary(position: Position, state: State): string {
    return `{\n`;
  },
  closeDictionary(position: Position, state: State): string {
    return position === Position.WholeSchema ? "" : ",\n";
  },
  openList(position: Position, state: State): string {
    return "list of ";
  },
  primitiveValue(label: Label<PrimitiveLabel>, state: State): string {
    return `<${label.type.description}>`;
  }
};

const delegate: ReporterDelegate = {
  structure,
  list,
  value
};

function formattedKey(key: string, optionality: Optionality): string {
  if (optionality === Optionality.Optional) {
    return `${key}?`;
  } else {
    return key;
  }
}

function padding(size: number): string {
  return " ".repeat(size);
}
