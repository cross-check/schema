import {
  Generic,
  Record,
  Type,
  generic,
  opaque,
  types
} from "@cross-check/schema";
import { ISODate, Url } from "../support";

export const SimpleArticle: Record = Record("SimpleArticle", {
  hed: types.SingleLine().required(),
  dek: types.Text(),
  body: types.Text().required()
});

export const MediumArticle: Record = Record("MediumArticle", {
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

export const Related: Record = Record("Related", {
  first: types.SingleLine(),
  last: types.Text(),

  person: types.hasOne(SimpleArticle).required(),
  articles: types.hasMany(MediumArticle)
});

export const Nesting: Record = Record("Nesting", {
  people: types
    .List(
      types.Dictionary({
        first: types.SingleLine(),
        last: types.Text()
      })
    )
    .required()
});

export const Cursor: () => Type = opaque("Cursor", types.Text());

export const PageInfo: Record = Record("PageInfo", {
  hasNextPage: types.Boolean().required(),
  hasPreviousPage: types.Boolean().required()
});

export const Edge: Generic = generic(T =>
  Record("Edge", {
    cursor: Cursor(),
    node: T
  })
);

export const Page: Generic = generic(T =>
  Record("Page", {
    edges: Edge(T),
    pageInfo: PageInfo
  }).required()
);

export const Bundle: Record = Record("Bundle", {
  name: types.SingleLine(),
  articles: Page(SimpleArticle)
});
