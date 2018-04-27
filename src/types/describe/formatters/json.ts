import { Dict, entries, unknown } from "ts-std";
import { HasLabel } from "../formatter";
import {
  DictionaryLabel,
  Label,
  ListLabel,
  Optionality,
  PrimitiveLabel,
  Visitor
} from "../label";
import { Position } from "../reporter";

class JSONFormatter extends Visitor {
  primitive(label: Label<PrimitiveLabel>, position: Position): unknown {
    let { name: type, args } = label.type.schemaType;
    let required =
      position === Position.Only || label.optionality === Optionality.Required;

    if (args.length) {
      return { type, args, required };
    } else {
      return { type, required };
    }
  }
  list(label: Label<ListLabel>): unknown {
    return {
      type: "List",
      items: this.visit(label.type.item, Position.Only),
      required: label.optionality === Optionality.Required
    };
  }
  dictionary(label: Label<DictionaryLabel>, position: Position): unknown {
    let members = {} as Dict;

    for (let [key, value] of entries(label.type.members)) {
      members[key] = this.visit(value!);
    }

    if (position === Position.WholeSchema) {
      return members;
    } else {
      return {
        type: "Dictionary",
        members,
        required: label.optionality === Optionality.Required
      };
    }
  }
}

export function toJSON(schema: HasLabel): unknown {
  return new JSONFormatter().dictionary(
    {
      type: schema.label,
      optionality: Optionality.None
    },
    Position.WholeSchema
  );
}
