import { ValueReporter } from "./default";
import {
  DictionaryLabel,
  Label,
  Optionality,
  PrimitiveLabel,
  Visitor
} from "./label";
import { Position, Reporter, ReporterDelegate, State } from "./reporter";

export function schemaFormat(schema: DictionaryLabel): string {
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
    return `${padding(state.padding * 2)}${key}: `;
  },

  closeDictionary(
    position: Position,
    optionality: Optionality,
    state: State
  ): string | void {
    if (position === Position.WholeSchema) {
      return `${padding(state.padding * 2)}}`;
    } else {
      state.buffer.push(`${padding(state.padding * 2)}})`);

      if (optionality === Optionality.Required) {
        state.buffer.push(".required()");
      }
    }
  },

  closeValue(position: Position, state: State): string | void {
    if (position === Position.First || position === Position.Middle) {
      return ",\n";
    } else if (position === Position.Last) {
      return "\n";
    }
  }
};

const list: ReporterDelegate["list"] = {
  openDictionary(position: Position, state: State): string {
    if (position === Position.WholeSchema) {
      return `{\n`;
    } else {
      return `Dictionary({\n`;
    }
  },

  closeList(position: Position, state: State): string {
    return ")";
  }
};

const value: ReporterDelegate["value"] = {
  openDictionary(position: Position, state: State): string {
    if (position === Position.WholeSchema) {
      return `{\n`;
    } else {
      return `Dictionary({\n`;
    }
  },
  closeDictionary(position: Position, state: State): string {
    return position === Position.WholeSchema ? "" : ",\n";
  },
  openList(position: Position, state: State): string {
    return "List(";
  },
  primitiveValue(label: Label<PrimitiveLabel>, state: State): string {
    return formatType(label);
  }
};
const delegate: ReporterDelegate = {
  structure,
  list,
  value
};

function formatType(label: Label<PrimitiveLabel>) {
  let { name, args } = label.type.schemaType;
  let out = `${name}(${args.join(", ")})`;

  if (label.optionality === Optionality.Required) {
    out += `.required()`;
  }

  return out;
}

function padding(size: number): string {
  return " ".repeat(size);
}
