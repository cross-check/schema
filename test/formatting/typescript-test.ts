import { Record, types, typescript } from "@cross-check/schema";
import { ISODate, strip } from "../support";
import { MediumArticle, SimpleArticle } from "../support/schemas";

QUnit.module("formatting - typescript");

QUnit.test("simple", assert => {
  assert.equal(
    typescript(SimpleArticle, { name: "SimpleArticle" }),

    strip`
        export interface SimpleArticle {
          hed: string;
          dek?: string;
          body: string;
        }
      `
  );

  assert.equal(
    typescript(SimpleArticle.draft, { name: "SimpleArticleDraft" }),

    strip`
        export interface SimpleArticleDraft {
          hed?: string;
          dek?: string;
          body?: string;
        }
      `
  );
});

QUnit.test("detailed", assert => {
  assert.equal(
    typescript(MediumArticle, { name: "MediumArticle" }),

    strip`
      export interface MediumArticle {
        hed: string;
        dek?: string;
        body: string;
        author?: {
          first?: string;
          last?: string;
        };
        issueDate?: Date;
        canonicalUrl?: string;
        tags?: Array<string>;
        categories: Array<string>;
        geo?: {
          lat: number;
          long: number;
        };
        contributors?: Array<{
          first?: string;
          last?: string;
        }>;
      }
    `
  );

  assert.equal(
    typescript(MediumArticle.draft, { name: "MediumArticleDraft" }),

    strip`
      export interface MediumArticleDraft {
        hed?: string;
        dek?: string;
        body?: string;
        author?: {
          first?: string;
          last?: string;
        };
        issueDate?: Date;
        canonicalUrl?: string;
        tags?: Array<string>;
        categories?: Array<string>;
        geo?: {
          lat?: number;
          long?: number;
        };
        contributors?: Array<{
          first?: string;
          last?: string;
        }>;
      }
    `
  );
});

QUnit.test("records", assert => {
  const RECORDS = Record("records", {
    geo: types.Required({ lat: types.Float(), long: types.Float() }),
    author: types
      .Required({
        first: types.SingleLine(),
        last: types.SingleLine()
      })
      .required(),
    date: ISODate()
  });

  assert.equal(
    typescript(RECORDS, { name: "Records" }),

    strip`
      export interface Records {
        geo?: {
          lat: number;
          long: number;
        };
        author: {
          first: string;
          last: string;
        };
        date?: Date;
      }
    `
  );

  assert.equal(
    typescript(RECORDS.draft, { name: "RecordsDraft" }),

    strip`
      export interface RecordsDraft {
        geo?: {
          lat?: number;
          long?: number;
        };
        author?: {
          first?: string;
          last?: string;
        };
        date?: Date;
      }
    `
  );
});
