import { graphql } from "@cross-check/schema";
import { GRAPHQL_SCALAR_MAP, strip } from "../support";
import {
  Bundle,
  MediumArticle,
  Related,
  SimpleArticle
} from "../support/schemas";

QUnit.module("formatting - graphql");

QUnit.test("simple", assert => {
  assert.equal(
    graphql(SimpleArticle, { name: "Simple", scalarMap: GRAPHQL_SCALAR_MAP }),
    strip`
      type Simple {
        hed: SingleLine!
        dek: String
        body: String!
      }
    `
  );

  assert.equal(
    graphql(SimpleArticle.draft, {
      name: "Simple",
      scalarMap: GRAPHQL_SCALAR_MAP
    }),
    strip`
      type Simple {
        hed: String
        dek: String
        body: String
      }
    `
  );
});

QUnit.test("detailed", assert => {
  assert.equal(
    graphql(MediumArticle, {
      name: "MediumArticle",
      scalarMap: GRAPHQL_SCALAR_MAP
    }),

    strip`
    type MediumArticleAuthor {
      first: SingleLine
      last: SingleLine
    }
    
    type MediumArticleGeo {
      lat: Int!
      long: Int!
    }
    
    type MediumArticleContributors {
      first: SingleLine
      last: SingleLine
    }
    
    type MediumArticle {
      hed: SingleLine!
      dek: String
      body: String!
      author: MediumArticleAuthor
      issueDate: ISODate
      canonicalUrl: Url
      tags: [SingleWord!]
      categories: [SingleLine!]!
      geo: MediumArticleGeo
      contributors: [MediumArticleContributors!]
    }
    `
  );
});

QUnit.test("relationships", assert => {
  assert.equal(
    graphql(Related, { name: "Related", scalarMap: GRAPHQL_SCALAR_MAP }),

    strip`
      type Related {
        first: SingleLine
        last: String
        person: SimpleArticle!
        articles: [MediumArticle!]
      }
    `
  );
});

QUnit.todo("pagination with Relay Cursors", assert => {
  assert.equal(
    graphql(Bundle, { name: "Bundle", scalarMap: GRAPHQL_SCALAR_MAP }),

    strip`
      type SimpleArticleEdge {
        cursor: Cursor
        node: SimpleArticle
      }

      type SimpleArticlePage {
        edges: SimpleArticleEdge
        pageInfo: PageInfo
      }

      type Bundle {
        name: SingleLine
        articles: SimpleArticlePage!
      }
    `
  );
});
