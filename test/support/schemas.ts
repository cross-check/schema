import {
  DirectValue,
  OptionalRefinedType,
  Schema,
  primitive,
  types
} from "@cross-check/schema";
import { ISODate, Url } from "../support";

export const SIMPLE = new Schema("SimpleArticle", {
  hed: types.SingleLine().required(),
  dek: types.Text(),
  body: types.Text().required()
});

export const DETAILED = new Schema("MediumArticle", {
  hed: types.SingleLine().required(),
  dek: types.Text(),
  body: types.Text().required(),
  author: types.Dictionary({
    first: types.SingleLine(),
    last: types.SingleLine()
  }),
  issueDate: ISODate(),
  canonicalUrl: Url(),
  tags: types.List(types.SingleWord()),
  categories: types.List(types.SingleLine()).required(),
  geo: types.Dictionary({
    lat: types.Integer().required(),
    long: types.Integer().required()
  }),
  contributors: types.List(
    types.Dictionary({ first: types.SingleLine(), last: types.SingleLine() })
  )
});

const Simple: OptionalRefinedType<DirectValue> = primitive(SIMPLE.custom)();

export const RELATED = new Schema("related", {
  first: types.Text(),
  last: types.Text(),

  person: types.hasOne(Simple)
});
