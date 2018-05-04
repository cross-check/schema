import { Schema, schemaFormat, types } from "@cross-check/schema";
import { ISODate, strip } from "../support";
import { DETAILED, SIMPLE } from "../support/schemas";

QUnit.module("formatting - schemaFormat");

QUnit.test("simple", assert => {
  assert.equal(
    schemaFormat(SIMPLE),

    strip`
      {
        hed: SingleLine().required(),
        dek: Text(),
        body: Text().required()
      }
    `
  );

  assert.equal(
    schemaFormat(SIMPLE.draft),

    strip`
      {
        hed: Text(),
        dek: Text(),
        body: Text()
      }
    `
  );
});

QUnit.test("detailed - published", assert => {
  assert.equal(
    schemaFormat(DETAILED),

    strip`
      {
        hed: SingleLine().required(),
        dek: Text(),
        body: Text().required(),
        author: Dictionary({
          first: SingleLine(),
          last: SingleLine()
        }),
        issueDate: ISODate(),
        canonicalUrl: Url(),
        tags: List(SingleWord()),
        categories: List(SingleLine()),
        geo: Dictionary({
          lat: Integer().required(),
          long: Integer().required()
        }),
        contributors: List(Dictionary({
          first: SingleLine(),
          last: SingleLine()
        }))
      }
    `
  );
});

QUnit.test("detailed - draft", assert => {
  assert.equal(
    schemaFormat(DETAILED.draft),

    strip`
      {
        hed: Text(),
        dek: Text(),
        body: Text(),
        author: Dictionary({
          first: Text(),
          last: Text()
        }),
        issueDate: ISODate(),
        canonicalUrl: Text(),
        tags: List(Text()),
        categories: List(Text()),
        geo: Dictionary({
          lat: Integer(),
          long: Integer()
        }),
        contributors: List(Dictionary({
          first: Text(),
          last: Text()
        }))
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
    schemaFormat(RECORDS),

    strip`
      {
        geo: Dictionary({
          lat: Number().required(),
          long: Number().required()
        }),
        author: Dictionary({
          first: SingleLine().required(),
          last: SingleLine().required()
        }).required(),
        date: ISODate()
      }
    `
  );

  assert.equal(
    schemaFormat(RECORDS.draft),

    strip`
      {
        geo: Dictionary({
          lat: Number(),
          long: Number()
        }),
        author: Dictionary({
          first: Text(),
          last: Text()
        }),
        date: ISODate()
      }
    `
  );
});
