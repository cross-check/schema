export { SingleLine, Text, Any, Num } from "./primitives";

// Note: This is called List to avoid conflicting with the builtin Array
export { List } from "./array";
// Note: This is called Dictionary to avoid conflicting wih the builtin Object
export { Dictionary } from "./dictionary";
export { Record } from "./record";
export {
  TypeFunction,
  OptionalType,
  toPrimitive,
  primitive,
  derived,
  primitiveLabel
} from "./type";
export { Interface } from "./utils";
export { describe, typescript } from "./describe";
