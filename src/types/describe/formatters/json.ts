import { Dict, unknown } from "ts-std";
import { HasLabel } from "../formatter";
import {
  DictionaryLabel,
  RecursiveDelegate,
  RecursiveVisitor,
  SchemaType
} from "../label";

class JSONFormatter implements RecursiveDelegate {
  private visitor = new RecursiveVisitor(this);
  schema(label: DictionaryLabel): unknown {
    let members = {} as Dict;

    this.visitor.processDictionary(label, (item, key) => {
      members[key] = item;
    });

    return members;
  }

  primitive({ name: type, args }: SchemaType, required: boolean): unknown {
    if (args.length) {
      return { type, args, required };
    } else {
      return { type, required };
    }
  }

  list(item: unknown, required: boolean): unknown {
    return {
      type: "List",
      items: item,
      required
    };
  }

  dictionary(label: DictionaryLabel, required: boolean): unknown {
    return {
      type: "Dictionary",
      members: this.schema(label),
      required
    };
  }
}

export function toJSON(schema: HasLabel): unknown {
  return new JSONFormatter().schema(schema.label);
}
