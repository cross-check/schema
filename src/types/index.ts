export * from "./primitives";

// Note: This is called List to avoid conflicting with the builtin Array
export { List } from "./array";
// Note: This is called Dictionary to avoid conflicting wih the builtin Object
export { Dictionary } from "./dictionary";
export { Record } from "./record";
export { primitive, type } from "./type";
export { Interface } from "./utils";
export {
  Label,
  describe,
  typescript,
  schemaFormat,
  serialize,
  toJSON,
  listTypes,
  label
} from "./describe";
