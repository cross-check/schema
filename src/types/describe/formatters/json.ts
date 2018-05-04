import { Dict, unknown } from "ts-std";
import { Schema } from "../formatter";
import { DictionaryLabel, NamedLabel, SchemaType } from "../label";
import { RecursiveDelegate, RecursiveVisitor } from "../visitor";

interface Primitive {
  type: string;
  args?: string[];
  required: boolean;
}

interface List {
  type: "List";
  items: Item;
  required: boolean;
}

interface Pointer {
  type: "Pointer";
  entity: Item;
  required: boolean;
}

interface Dictionary {
  type: "Dictionary";
  members: Dict<Item>;
  required: boolean;
}

type Item = List | Primitive | Dictionary;

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
      type: label.type,
      name: label.name,
      required
    };
  }

  pointer(entity: Item, required: boolean): Pointer {
    return {
      type: "Pointer",
      entity,
      required
    };
  }

  list(item: Item, required: boolean): List {
    return {
      type: "List",
      items: item,
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
