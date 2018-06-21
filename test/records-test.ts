import { Record, types } from "@cross-check/schema";
import {
  missingError,
  typeError,
  validateDraft,
  validatePublished
} from "./support";

QUnit.module("Records");

QUnit.test("optional dictionaries with required fields (geo)", async assert => {
  const RECORDS: Record = Record("records", {
    geo: types.Required({ lat: types.Float(), long: types.Float() }),
    author: types.Required({
      first: types.SingleLine(),
      last: types.SingleLine()
    })
  });

  assert.deepEqual(
    await validateDraft(RECORDS, {
      geo: null,
      author: null
    }),
    [],
    "drafts do not need optional records"
  );

  assert.deepEqual(
    await validatePublished(RECORDS, {
      geo: {
        lat: null,
        long: null
      },
      author: null
    }),
    [missingError("geo.lat"), missingError("geo.long")],
    "published documents must include nested required fields if dictionary is present"
  );

  assert.deepEqual(
    await validatePublished(RECORDS, {
      geo: null,
      author: null
    }),
    [],
    "published documents may leave out optional dictionaries"
  );

  assert.deepEqual(
    await validateDraft(RECORDS, {
      geo: { lat: "10", long: "20" },
      author: null
    }),
    [typeError("number", "geo.lat"), typeError("number", "geo.long")],
    "nested fields in drafts use the draft type (but numbers still are't strings)"
  );

  assert.deepEqual(
    await validatePublished(RECORDS, {
      geo: { lat: "10", long: "20" },
      author: null
    }),
    [typeError("number", "geo.lat"), typeError("number", "geo.long")],
    "nested fields in published documents use the schema type (but numbers aren't strings)"
  );

  assert.deepEqual(
    await validateDraft(RECORDS, {
      geo: null,
      author: { first: "Christina\nTODO: Check", last: "Kung" }
    }),
    [],
    "nested fields in drafts use the draft type (multiline strings are accepted for single-line strings)"
  );

  assert.deepEqual(
    await validatePublished(RECORDS, {
      geo: null,
      author: { first: "Christina\nTODO: Check", last: "Kung" }
    }),
    [typeError("string:single-line", "author.first")],
    "nested fields in published documents use the schema type (multiline strings are not valid single-line strings)"
  );
});

QUnit.test("required dictionaries with required fields (geo)", async assert => {
  const RECORDS = Record("records", {
    geo: types.Required({ lat: types.Float(), long: types.Float() }).required()
  });

  assert.deepEqual(
    await validateDraft(RECORDS, {
      geo: null
    }),
    [],
    "drafts do not need required records"
  );

  assert.deepEqual(
    await validatePublished(RECORDS, {
      geo: {
        lat: null,
        long: null
      }
    }),
    [missingError("geo.lat"), missingError("geo.long")],
    "drafts must include nested required fields if record is present"
  );

  assert.deepEqual(
    await validatePublished(RECORDS, {
      geo: null
    }),
    [missingError("geo")],
    "published documents must include required records"
  );

  assert.deepEqual(
    await validatePublished(RECORDS, {
      geo: {
        lat: null,
        long: null
      }
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

  const STRING_RECORDS = Record("string-records", {
    author: types
      .Required({
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
