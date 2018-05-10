import { Dict, JSON, Option, unknown } from "ts-std";
import { Schema } from "../formatter";
import {
  DictionaryLabel,
  GenericLabel,
  IteratorLabel,
  NamedLabel,
  PointerLabel,
  SchemaType
} from "../label";
import { RecursiveDelegate, RecursiveVisitor } from "../visitor";

interface Primitive {
  type: string;
  args?: JSON;
  required: boolean;
}

interface Generic {
  type: "Pointer" | "List" | "Iterator";
  kind?: string;
  args?: JSON;
  of: Item;
  required: boolean;
}

interface GenericReference extends Generic {
  type: "Pointer" | "Iterator";
  kind: string;
  args?: JSON;
  of: Item;
  required: boolean;
}

type GenericOptions = Pick<GenericReference, "kind" | "args">;

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
    if (args !== undefined) {
      return { type, args, required };
    } else {
      return { type, required };
    }
  }

  named(label: NamedLabel, required: boolean): unknown {
    return {
      type: label.type.kind,
      name: label.name.name,
      required
    };
  }

  generic<L extends GenericLabel>(
    entity: Item,
    label: L,
    required: boolean
  ): Generic {
    let type: "Pointer" | "List" | "Iterator";
    let options: Option<{ kind?: string; args?: JSON }> = {};

    if (label.kind === "iterator") {
      type = "Iterator";
      options = referenceOptions(label as IteratorLabel);
    } else if (label.kind === "list") {
      type = "List";
    } else if (label.kind === "pointer") {
      type = "Pointer";
      options = referenceOptions(label as IteratorLabel);
    } else {
      throw new Error("unreachable");
    }

    return {
      type: type!,
      ...options,
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

function referenceOptions(
  label: PointerLabel | IteratorLabel
): Pick<GenericReference, "kind" | "args"> {
  let schemaType = (label as IteratorLabel).schemaType;

  let options = {
    kind: schemaType.name
  } as GenericOptions;

  if (schemaType.args) {
    options.args = schemaType.args;
  }

  return options;
}

export function toJSON(schema: Schema): unknown {
  return new JSONFormatter().schema(schema.label.type);
}
