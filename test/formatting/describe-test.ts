import { Schema, describe, types } from "@cross-check/schema";
import { ISODate, strip } from "../support";
import { DETAILED, RELATED, SIMPLE } from "../support/schemas";

QUnit.module("formatting - describe");

QUnit.test("simple", assert => {
  assert.equal(
    describe(SIMPLE),

    strip`
      {
        hed: <single line string>,
        dek?: <string>,
        body: <string>
      }
    `
  );

  assert.equal(
    describe(SIMPLE.draft),

    strip`
      {
        hed?: <string>,
        dek?: <string>,
        body?: <string>
      }
    `
  );
});

QUnit.test("detailed", assert => {
  assert.equal(
    describe(DETAILED),

    strip`
      {
        hed: <single line string>,
        dek?: <string>,
        body: <string>,
        author?: {
          first?: <single line string>,
          last?: <single line string>
        },
        issueDate?: <ISO Date>,
        canonicalUrl?: <url>,
        tags?: list of <single word string>,
        categories: list of <single line string>,
        geo?: {
          lat: <integer>,
          long: <integer>
        },
        contributors?: list of {
          first?: <single line string>,
          last?: <single line string>
        }
      }
    `
  );

  assert.equal(
    describe(DETAILED.draft),

    strip`
      {
        hed?: <string>,
        dek?: <string>,
        body?: <string>,
        author?: {
          first?: <string>,
          last?: <string>
        },
        issueDate?: <ISO Date>,
        canonicalUrl?: <string>,
        tags?: list of <string>,
        categories?: list of <string>,
        geo?: {
          lat?: <integer>,
          long?: <integer>
        },
        contributors?: list of {
          first?: <string>,
          last?: <string>
        }
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
    describe(RECORDS),

    strip`
      {
        geo?: {
          lat: <number>,
          long: <number>
        },
        author: {
          first: <single line string>,
          last: <single line string>
        },
        date?: <ISO Date>
      }
    `
  );

  assert.equal(
    describe(RECORDS.draft),

    strip`
      {
        geo?: {
          lat?: <number>,
          long?: <number>
        },
        author?: {
          first?: <string>,
          last?: <string>
        },
        date?: <ISO Date>
      }
    `
  );
});

QUnit.test("relationships", assert => {
  assert.equal(
    describe(RELATED),

    strip`
      {
        first?: <string>,
        last?: <string>,
        person?: has one SimpleArticle
      }
    `
  );
});
