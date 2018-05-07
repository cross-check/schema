import { Schema, listTypes, types } from "@cross-check/schema";
import { ISODate } from "../support";
import { MediumArticle, Related, SimpleArticle } from "../support/schemas";

QUnit.module("formatting - listTypes");

QUnit.test("simple", assert => {
  assert.deepEqual(listTypes(SimpleArticle), ["SingleLine", "Text"]);
});

QUnit.test("detailed", assert => {
  assert.deepEqual(listTypes(MediumArticle), [
    "Dictionary",
    "ISODate",
    "Integer",
    "List",
    "SingleLine",
    "SingleWord",
    "Text",
    "Url"
  ]);
});

QUnit.test("recods", assert => {
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

  assert.deepEqual(listTypes(RECORDS), [
    "Dictionary",
    "ISODate",
    "Number",
    "SingleLine"
  ]);
});

QUnit.test("relationships", assert => {
  assert.deepEqual(listTypes(Related), [
    "Iterator",
    "MediumArticle",
    "Pointer",
    "SimpleArticle",
    "SingleLine",
    "Text"
  ]);
});
