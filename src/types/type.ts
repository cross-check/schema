import { Type } from "./fundamental/value";

/**
 * Internals Vocabulary:
 *
 * Reference Type:
 *   Represents data that is not directly included in the parent object.
 *   Dereferencing a reference may be asynchronous.
 *
 * Inline Type:
 *   Represent data that is directly included in the parent object.
 *   They include scalars, lists and dictionaries.
 *
 * Value:
 *   A value of any type (reference or inline).
 *
 * Scalar (Inline):
 *   A single inline value.
 *
 * List (Inline):
 *   A list of inline values.
 *
 * Dictionary (Inline):
 *   A set of key-value pairs. A dictionary's values are inline value. A dictionary's keys are strings.
 *
 * Pointer (Reference):
 *   A reference to another value.
 *
 * Iterator (Reference):
 *   A reference to a sequence of values. Each iteration of an iterator may be asynchronous.
 *
 * Refined Type:
 *   A type that has a strict component and a draft component. Component must either both be inline
 *   or both be references. A type's draft component corresponds to distinctions in underlying
 *   storage and user interface elements, and is intended to make it possible to auto-save
 *   in-progress work in a user interface.s
 */

export interface TypeClass {
  new (): Type;
}

export type TypeDescription = TypeClass | Type;

export function generic(callback: (...T: Type[]) => Type): Generic {
  return (...descs: TypeDescription[]) => {
    let types = descs.map(constructType);
    return callback(...types);
  };
}

export type Generic = (...T: TypeDescription[]) => Type;

export function basic(desc: TypeDescription): () => Type {
  let type = constructType(desc);
  return () => type;
}

export function opaque(_name: string, type: TypeDescription): () => Type {
  // TODO: This should be a named type
  let t = constructType(type);
  return () => t;
}

function constructType(desc: TypeDescription): Type {
  return typeof desc === "function" ? new desc() : desc;
}
