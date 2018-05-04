import { graphql } from "@cross-check/schema";
import { GRAPHQL_SCALAR_MAP, strip } from "../support";
import { DETAILED, RELATED, SIMPLE } from "../support/schemas";

QUnit.module("formatting - graphql");

QUnit.test("simple", assert => {
  assert.equal(
    graphql(SIMPLE, { name: "Simple", scalarMap: GRAPHQL_SCALAR_MAP }),
    strip`
      type Simple {
        hed: SingleLine!
        dek: String
        body: String!
      }
    `
  );

  assert.equal(
    graphql(SIMPLE.draft, { name: "Simple", scalarMap: GRAPHQL_SCALAR_MAP }),
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
    graphql(DETAILED, { name: "MediumArticle", scalarMap: GRAPHQL_SCALAR_MAP }),

    strip`
    type MediumArticle_author {
      first: SingleLine
      last: SingleLine
    }
    
    type MediumArticle_geo {
      lat: Int!
      long: Int!
    }
    
    type MediumArticle_contributors {
      first: SingleLine
      last: SingleLine
    }
    
    type MediumArticle {
      hed: SingleLine!
      dek: String
      body: String!
      author: MediumArticle_author
      issueDate: ISODate
      canonicalUrl: Url
      tags: [SingleWord!]
      categories: [SingleLine!]!
      geo: MediumArticle_geo
      contributors: [MediumArticle_contributors!]
    }
    `
  );
});

QUnit.test("relationships", assert => {
  assert.equal(
    graphql(RELATED, { name: "Related", scalarMap: GRAPHQL_SCALAR_MAP }),

    strip`
      type Related {
        first: String
        last: String
        person: SimpleArticle
      }
    `
  );
});
