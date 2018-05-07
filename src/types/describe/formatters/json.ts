import { Dict, unknown } from "ts-std";
import { Schema } from "../formatter";
import {
  DictionaryLabel,
  GenericLabel,
  NamedLabel,
  SchemaType
} from "../label";
import { RecursiveDelegate, RecursiveVisitor } from "../visitor";

interface Primitive {
  type: string;
  args?: string[];
  required: boolean;
}

interface Generic {
  type: "Pointer" | "List" | "Iterator";
  of: Item;
  required: boolean;
}

interface Dictionary {
  type: "Dictionary";
  members: Dict<Item>;
  required: boolean;
}

type Item = Generic | Primitive | Dictionary;

class JSONFormatter implements RecursiveDelegate {
  private visitor = RecursiveVisitor.build(this);

  schema(label: DictionaryLabel): Dict<Item> {
    let members = {} as Dict<Item>;

    this.visitor.processDictionary(label, (item, key) => {
      members[key] = item;
    });

    return members;
  }

  primitive({ name: type, args }: SchemaType, required: boolean): Primitive {
    if (args.length) {
      return { type, args, required };
    } else {
      return { type, required };
    }
  }

  named(label: NamedLabel, required: boolean): unknown {
    return {
      type: label.type.kind,
      name: label.name,
      required
    };
  }

  generic<L extends GenericLabel>(
    entity: Item,
    label: L,
    required: boolean
  ): Generic {
    let kind: "Pointer" | "List" | "Iterator";

    if (label.kind === "iterator") {
      kind = "Iterator";
    } else if (label.kind === "list") {
      kind = "List";
    } else if (label.kind === "pointer") {
      kind = "Pointer";
    } else {
      throw new Error("unreachable");
    }

    return {
      type: kind!,
      of: entity,
      required
    };
  }

  dictionary(label: DictionaryLabel, required: boolean): Dictionary {
    return {
      type: "Dictionary",
      members: this.schema(label),
      required
    };
  }
}

export function toJSON(schema: Schema): unknown {
  return new JSONFormatter().schema(schema.label.type);
}
