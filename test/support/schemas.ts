import { Schema, types } from "@cross-check/schema";
import { ISODate, Url } from "../support";

export const SimpleArticle = new Schema("SimpleArticle", {
  hed: types.SingleLine().required(),
  dek: types.Text(),
  body: types.Text().required()
});

export const MediumArticle = new Schema("MediumArticle", {
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

export const Related = new Schema("Related", {
  first: types.SingleLine(),
  last: types.Text(),

  person: types.hasOne(SimpleArticle).required(),
  articles: types.hasMany(MediumArticle)
});

export const Nesting = new Schema("Nesting", {
  people: types
    .List(
      types.Dictionary({
        first: types.SingleLine(),
        last: types.Text()
      })
    )
    .required()
});
