import { Dict, unknown } from "ts-std";
import { Schema } from "../formatter";
import { DictionaryLabel, SchemaType } from "../label";
import { RecursiveDelegate, RecursiveVisitor } from "../visitor";

class ListTypes implements RecursiveDelegate {
  private visitor = new RecursiveVisitor(this);
  schema(label: DictionaryLabel): string[] {
    return Object.keys(this.dict(label)).sort();
  }

  primitive({ name }: SchemaType): Dict {
    return { [name]: true };
  }

  list(item: Dict): Dict {
    return { ...item, List: true };
  }

  dictionary(label: DictionaryLabel): Dict {
    return { ...this.dict(label), Dictionary: true };
  }

  private dict(label: DictionaryLabel) {
    let members: Dict = {};

    this.visitor.processDictionary(label, (item: Dict) => {
      members = { ...members, ...item };
    });

    return members;
  }
}

export function listTypes(schema: Schema): unknown {
  return new ListTypes().schema(schema.label);
}
