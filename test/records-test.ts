import { Schema, types } from "@cross-check/schema";
import {
  missingError,
  typeError,
  validateDraft,
  validatePublished
} from "./support";

QUnit.module("Records");

QUnit.test("optional records (geo)", async assert => {
  const RECORDS = new Schema("records", {
    geo: types.Record({ lat: types.Number(), long: types.Number() }),
    author: types.Record({
      first: types.SingleLine(),
      last: types.SingleLine()
    })
  });

  assert.deepEqual(
    await validateDraft(RECORDS, {}),
    [],
    "drafts do not need optional records"
  );

  assert.deepEqual(
    await validatePublished(RECORDS, {
      geo: {}
    }),
    [missingError("geo.lat"), missingError("geo.long")],
    "published documents must include nested required fields if dictionary is present"
  );

  assert.deepEqual(
    await validatePublished(RECORDS, {}),
    [],
    "published documents may leave out optional dictionaries"
  );

  assert.deepEqual(
    await validateDraft(RECORDS, {
      geo: { lat: "10", long: "20" }
    }),
    [typeError("number", "geo.lat"), typeError("number", "geo.long")],
    "nested fields in drafts use the draft type (but numbers still are't strings)"
  );

  assert.deepEqual(
    await validatePublished(RECORDS, {
      hed: "A single line",
      body: "Hello world\nMore content",
      geo: { lat: "10", long: "20" },
      categories: ["single"]
    }),
    [typeError("number", "geo.lat"), typeError("number", "geo.long")],
    "nested fields in published documents use the schema type (but numbers aren't strings)"
  );

  assert.deepEqual(
    await validateDraft(RECORDS, {
      author: { first: "Christina\nTODO: Check", last: "Kung" }
    }),
    [],
    "nested fields in drafts use the draft type (multiline strings are accepted for single-line strings)"
  );

  assert.deepEqual(
    await validatePublished(RECORDS, {
      author: { first: "Christina\nTODO: Check", last: "Kung" }
    }),
    [typeError("string:single-line", "author.first")],
    "nested fields in published documents use the schema type (multiline strings are not valid single-line strings)"
  );
});

QUnit.test("required records (geo)", async assert => {
  const RECORDS = new Schema("records", {
    geo: types.Record({ lat: types.Number(), long: types.Number() }).required()
  });

  assert.deepEqual(
    await validateDraft(RECORDS, {}),
    [],
    "drafts do not need required records"
  );

  assert.deepEqual(
    await validatePublished(RECORDS, {
      geo: {}
    }),
    [missingError("geo.lat"), missingError("geo.long")],
    "drafts must include nested required fields if record is present"
  );

  assert.deepEqual(
    await validatePublished(RECORDS, {}),
    [missingError("geo")],
    "published documents must include required records"
  );

  assert.deepEqual(
    await validatePublished(RECORDS, {
      geo: {}
    }),
    [missingError("geo.lat"), missingError("geo.long")],
    "published documents must include nested required fields if record is present"
  );

  assert.deepEqual(
    await validateDraft(RECORDS, {
      geo: { lat: "10", long: "20" }
    }),
    [typeError("number", "geo.lat"), typeError("number", "geo.long")],
    "nested fields in drafts use the draft type (but numbers still are't strings)"
  );

  assert.deepEqual(
    await validatePublished(RECORDS, {
      geo: { lat: "10", long: "20" }
    }),
    [typeError("number", "geo.lat"), typeError("number", "geo.long")],
    "nested fields in published documents use the schema type (but numbers aren't strings)"
  );

  const STRING_RECORDS = new Schema("string-records", {
    author: types
      .Record({
        first: types.SingleLine(),
        last: types.SingleLine()
      })
      .required()
  });

  assert.deepEqual(
    await validateDraft(STRING_RECORDS, {
      author: { first: "Christina\nTODO: Check", last: "Kung" }
    }),
    [],
    "nested fields in drafts use the draft type (multiline strings are accepted for single-line strings)"
  );

  assert.deepEqual(
    await validatePublished(STRING_RECORDS, {
      author: { first: "Christina\nTODO: Check", last: "Kung" }
    }),
    [typeError("string:single-line", "author.first")],
    "nested fields in published documents use the schema type (multiline strings are not valid single-line strings)"
  );
});
