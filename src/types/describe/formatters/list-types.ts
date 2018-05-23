import { Dict, unknown } from "ts-std";
import { Schema } from "../formatter";
import {
  DictionaryLabel,
  GenericLabel,
  Label,
  NamedLabel,
  typeNameOf
} from "../label";
import { RecursiveDelegate, RecursiveVisitor } from "../visitor";

class ListTypes implements RecursiveDelegate {
  private visitor = RecursiveVisitor.build(this);

  schema(label: DictionaryLabel): string[] {
    return Object.keys(this.dict(label)).sort();
  }

  named({ name }: NamedLabel): Dict {
    return { [name]: true };
  }

  primitive({ name }: Label): Dict {
    return { [typeNameOf(name)]: true };
  }

  generic(of: Dict, label: Label<GenericLabel>): Dict {
    let kind = label.type.kind;
    let name = `${kind[0].toUpperCase()}${kind.slice(1)}`;
    return { ...of, [name]: true };
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
  return new ListTypes().schema(schema.label.type);
}
