import { Schema, types, typescript } from "@cross-check/schema";
import { ISODate, strip } from "../support";
import { DETAILED, SIMPLE } from "../support/schemas";

QUnit.module("formatting - typescript");

QUnit.test("simple", assert => {
  assert.equal(
    typescript(SIMPLE, { name: "SimpleArticle" }),

    strip`
        export interface SimpleArticle {
          hed: string;
          dek?: string;
          body: string;
        }
      `
  );

  assert.equal(
    typescript(SIMPLE.draft, { name: "SimpleArticleDraft" }),

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
    typescript(DETAILED, { name: "MediumArticle" }),

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
    typescript(DETAILED.draft, { name: "MediumArticleDraft" }),

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
  const RECORDS = new Schema("records", {
    geo: types.Record({ lat: types.Number(), long: types.Number() }),
    author: types
      .Record({
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
