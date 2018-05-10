import {
  error,
  missingError,
  typeError,
  urlish,
  validateDraft,
  validatePublished
} from "./support";
import { MediumArticle } from "./support/schemas";

QUnit.module("@cross-check/schema - detailed schema");

QUnit.test(
  "missing fields (including dictionaries with required fields inside and required arrays)",
  async assert => {
    assert.deepEqual(
      await validateDraft(MediumArticle, {}),
      [],
      "draft schemas can be missing fields"
    );
  }
);

QUnit.test("drafts", async assert => {
  assert.deepEqual(
    await validateDraft(MediumArticle, {
      hed: "Not\nactually\na\nsingle\nline",
      canonicalUrl: "totally -- invalid :: url"
    }),
    [],
    "can be missing fields"
  );

  assert.deepEqual(
    await validateDraft(MediumArticle, {
      categories: []
    }),
    [],
    "can supply empty arrays for required arrays"
  );

  assert.deepEqual(
    await validateDraft(MediumArticle, {
      categories: ["This\nis\na multiline\nstring"]
    }),
    [],
    "arrays use the draft type of their members"
  );
});

QUnit.test("published documents", async assert => {
  assert.deepEqual(
    await validatePublished(MediumArticle, {
      hed: "Not\nactually\na\nsingle\nline",
      canonicalUrl: "totally -- invalid :: url"
    }),
    [
      typeError("string:single-line", "hed"),
      missingError("body"),
      error("url", ["absolute"], "canonicalUrl"),
      missingError("categories")
    ],
    "match the schema"
  );

  assert.deepEqual(
    await validatePublished(MediumArticle, {
      hed: "A single line",
      body: "Hello world\nMore content",
      tags: [1, "tag", {}],
      categories: ["single"]
    }),
    [typeError("string", "tags.0"), typeError("string", "tags.2")],
    "if an optional field is present, it must match the schema"
  );
});

QUnit.test("dates (issueDate)", async assert => {
  assert.deepEqual(
    await validateDraft(MediumArticle, {
      issueDate: "not -- a valid :: date"
    }),
    [typeError("iso-date", "issueDate")],
    "dates don't widen into strings for drafts"
  );

  assert.deepEqual(
    await validatePublished(MediumArticle, {
      hed: "A single line",
      body: "Hello world\nMore content",
      issueDate: "not -- a valid :: date",
      categories: ["single"]
    }),
    [typeError("iso-date", "issueDate")]
  );
});

QUnit.test("optional dictionaries (geo)", async assert => {
  assert.deepEqual(
    await validateDraft(MediumArticle, {
      geo: {}
    }),
    [],
    "drafts do not need nested required fields"
  );

  assert.deepEqual(
    await validatePublished(MediumArticle, {
      hed: "A single line",
      body: "Hello world\nMore content",
      geo: {},
      categories: ["single"]
    }),
    [missingError("geo.lat"), missingError("geo.long")],
    "published documents must include nested required fields if dictionary is present"
  );

  assert.deepEqual(
    await validatePublished(MediumArticle, {
      hed: "A single line",
      body: "Hello world\nMore content",
      categories: ["single"]
    }),
    [],
    "published documents may leave out optional dictionaries"
  );

  assert.deepEqual(
    await validatePublished(MediumArticle, {
      hed: "A single line",
      body: "Hello world\nMore content"
    }),
    [missingError("categories")],
    "published documents may not leave out required dictionaries"
  );

  assert.deepEqual(
    await validateDraft(MediumArticle, {
      geo: { lat: "10", long: "20" }
    }),
    [typeError("number", "geo.lat"), typeError("number", "geo.long")],
    "nested fields in drafts use the draft type (but numbers still are't strings)"
  );

  assert.deepEqual(
    await validatePublished(MediumArticle, {
      hed: "A single line",
      body: "Hello world\nMore content",
      geo: { lat: "10", long: "20" },
      categories: ["single"]
    }),
    [typeError("number", "geo.lat"), typeError("number", "geo.long")],
    "nested fields in published documents use the schema type (but numbers aren't strings)"
  );

  assert.deepEqual(
    await validatePublished(MediumArticle, {
      hed: "A single line",
      body: "Hello world\nMore content",
      geo: { lat: 10.5, long: 20.5 },
      categories: ["single"]
    }),
    [
      typeError("number:integer", "geo.lat"),
      typeError("number:integer", "geo.long")
    ],
    "nested fields in published documents use the schema type (floats aren't integers)"
  );

  assert.deepEqual(
    await validateDraft(MediumArticle, {
      author: { first: "Christina\nTODO: Check", last: "Kung" }
    }),
    [],
    "nested fields in drafts use the draft type (multiline strings are accepted for single-line strings)"
  );

  assert.deepEqual(
    await validatePublished(MediumArticle, {
      hed: "A single line",
      author: { first: "Christina\nTODO: Check", last: "Kung" },
      body: "Hello world\nMore content",
      categories: ["single"]
    }),
    [typeError("string:single-line", "author.first")],
    "nested fields in published documents use the schema type (multiline strings are not valid single-line strings)"
  );
});

QUnit.test("optional dictionaries (geo)", async assert => {
  assert.deepEqual(
    await validateDraft(MediumArticle, {
      geo: {}
    }),
    [],
    "drafts do not need nested required fields"
  );

  assert.deepEqual(
    await validatePublished(MediumArticle, {
      hed: "A single line",
      body: "Hello world\nMore content",
      geo: {},
      categories: ["single"]
    }),
    [missingError("geo.lat"), missingError("geo.long")],
    "published documents must include nested required fields if dictionary is present"
  );

  assert.deepEqual(
    await validatePublished(MediumArticle, {
      hed: "A single line",
      body: "Hello world\nMore content",
      categories: ["single"]
    }),
    [],
    "published documents may leave out optional dictionaries"
  );

  assert.deepEqual(
    await validatePublished(MediumArticle, {
      hed: "A single line",
      body: "Hello world\nMore content"
    }),
    [missingError("categories")],
    "published documents may not leave out required dictionaries"
  );

  assert.deepEqual(
    await validateDraft(MediumArticle, {
      geo: { lat: "10", long: "20" }
    }),
    [typeError("number", "geo.lat"), typeError("number", "geo.long")],
    "nested fields in drafts use the draft type (but numbers still are't strings)"
  );

  assert.deepEqual(
    await validatePublished(MediumArticle, {
      hed: "A single line",
      body: "Hello world\nMore content",
      geo: { lat: "10", long: "20" },
      categories: ["single"]
    }),
    [typeError("number", "geo.lat"), typeError("number", "geo.long")],
    "nested fields in published documents use the schema type (but numbers aren't strings)"
  );

  assert.deepEqual(
    await validateDraft(MediumArticle, {
      author: { first: "Christina\nTODO: Check", last: "Kung" }
    }),
    [],
    "nested fields in drafts use the draft type (multiline strings are accepted for single-line strings)"
  );

  assert.deepEqual(
    await validatePublished(MediumArticle, {
      hed: "A single line",
      author: { first: "Christina\nTODO: Check", last: "Kung" },
      body: "Hello world\nMore content",
      categories: ["single"]
    }),
    [typeError("string:single-line", "author.first")],
    "nested fields in published documents use the schema type (multiline strings are not valid single-line strings)"
  );
});

QUnit.test("required lists (categories)", async assert => {
  assert.deepEqual(
    await validatePublished(MediumArticle, {
      hed: "A single line",
      body: "Hello world\nMore content",
      geo: { lat: 10, long: 20 },
      categories: []
    }),
    [typeError("present-array", "categories")],
    "in published documents, required lists must have at least one element"
  );

  assert.deepEqual(
    await validateDraft(MediumArticle, {
      hed: "A single line",
      body: "Hello world\nMore content",
      geo: { lat: 10, long: 20 },
      categories: []
    }),
    [],
    "in drafts, required lists may be empty"
  );

  assert.deepEqual(
    await validatePublished(MediumArticle, {
      hed: "A single line",
      body: "Hello world\nMore content",
      geo: { lat: 10, long: 20 }
    }),
    [typeError("present", "categories")],
    "in published documents, required lists may not be missing"
  );

  assert.deepEqual(
    await validateDraft(MediumArticle, {
      hed: "A single line",
      body: "Hello world\nMore content",
      geo: { lat: 10, long: 20 }
    }),
    [],
    "in drafts, required lists may be missing"
  );
});

QUnit.test("optional lists (tags)", async assert => {
  assert.deepEqual(
    await validatePublished(MediumArticle, {
      hed: "A single line",
      body: "Hello world\nMore content",
      geo: { lat: 10, long: 20 },
      tags: [],
      categories: ["somecategory"]
    }),
    [],
    "in published documents, optional lists may be empty"
  );

  assert.deepEqual(
    await validateDraft(MediumArticle, {
      hed: "A single line",
      body: "Hello world\nMore content",
      geo: { lat: 10, long: 20 },
      tags: [],
      categories: ["somecategory"]
    }),
    [],
    "in drafts, optional lists may be empty"
  );

  assert.deepEqual(
    await validatePublished(MediumArticle, {
      hed: "A single line",
      body: "Hello world\nMore content",
      geo: { lat: 10, long: 20 },
      categories: ["somecategory"]
    }),
    [],
    "in published documents, optional lists may be missing"
  );

  assert.deepEqual(
    await validateDraft(MediumArticle, {
      hed: "A single line",
      body: "Hello world\nMore content",
      categories: ["somecategory"],
      geo: { lat: 10, long: 20 }
    }),
    [],
    "in drafts, optional lists may be missing"
  );
});

QUnit.test("parsing", assert => {
  assert.deepEqual(
    MediumArticle.parse({
      hed: "Hello world",
      body: "The body",
      categories: ["one category", "two categories"]
    }),
    {
      hed: "Hello world",
      dek: null,
      body: "The body",
      author: null,
      issueDate: null,
      canonicalUrl: null,
      tags: null,
      categories: ["one category", "two categories"],
      geo: null,
      contributors: null
    }
  );

  assert.deepEqual(
    MediumArticle.parse({
      hed: "Hello world",
      dek: null,
      body: "The body",
      author: null,
      issueDate: null,
      canonicalUrl: null,
      tags: null,
      categories: ["one category", "two categories"],
      geo: null,
      contributors: null
    }),
    {
      hed: "Hello world",
      dek: null,
      body: "The body",
      author: null,
      issueDate: null,
      canonicalUrl: null,
      tags: null,
      categories: ["one category", "two categories"],
      geo: null,
      contributors: null
    }
  );

  let date = new Date();
  let url = urlish("https://example.com/path/to/hello");

  assert.deepEqual(
    MediumArticle.parse({
      hed: "Hello world",
      dek: "Hello. Hello world.",
      body: "The body",
      author: {
        first: "Christina"
        // nested missing stuff serializes to nulls
      },
      issueDate: date.toISOString(),
      canonicalUrl: url.toString(),
      tags: ["one-tag", "two-tag", "red-tag", "blue-tag"],
      categories: ["one category", "two categories"],
      geo: {
        lat: 100,
        long: 100
      },
      contributors: [
        { first: "Dan" },
        { last: "Ohara" },
        { first: "Godfrey", last: "Chan" }
      ]
    }),
    {
      hed: "Hello world",
      dek: "Hello. Hello world.",
      body: "The body",
      author: {
        first: "Christina",
        last: null
      },
      issueDate: date,
      canonicalUrl: url,
      tags: ["one-tag", "two-tag", "red-tag", "blue-tag"],
      categories: ["one category", "two categories"],
      geo: {
        lat: 100,
        long: 100
      },
      contributors: [
        { first: "Dan", last: null },
        { first: null, last: "Ohara" },
        { first: "Godfrey", last: "Chan" }
      ]
    }
  );
});

QUnit.test("serializing", assert => {
  assert.deepEqual(
    MediumArticle.serialize({
      hed: "Hello world",
      body: "The body",
      categories: ["one category", "two categories"]
    }),
    {
      hed: "Hello world",
      dek: null,
      body: "The body",
      author: null,
      issueDate: null,
      canonicalUrl: null,
      tags: null,
      categories: ["one category", "two categories"],
      geo: null,
      contributors: null
    }
  );

  assert.deepEqual(
    MediumArticle.serialize({
      hed: "Hello world",
      dek: null,
      body: "The body",
      author: null,
      issueDate: null,
      canonicalUrl: null,
      tags: null,
      categories: ["one category", "two categories"],
      geo: null,
      contributors: null
    }),
    {
      hed: "Hello world",
      dek: null,
      body: "The body",
      author: null,
      issueDate: null,
      canonicalUrl: null,
      tags: null,
      categories: ["one category", "two categories"],
      geo: null,
      contributors: null
    }
  );

  let date = new Date();
  let url = urlish("https://example.com/path/to/hello");

  assert.deepEqual(
    MediumArticle.serialize({
      hed: "Hello world",
      dek: "Hello. Hello world.",
      body: "The body",
      author: {
        first: "Christina"
        // nested missing stuff serializes to nulls
      },
      issueDate: date,
      canonicalUrl: url,
      tags: ["one-tag", "two-tag", "red-tag", "blue-tag"],
      categories: ["one category", "two categories"],
      geo: {
        lat: 100,
        long: 100
      },
      contributors: [
        { first: "Dan" },
        { last: "Ohara" },
        { first: "Godfrey", last: "Chan" }
      ]
    }),
    {
      hed: "Hello world",
      dek: "Hello. Hello world.",
      body: "The body",
      author: {
        first: "Christina",
        last: null
      },
      issueDate: date.toISOString(),
      canonicalUrl: url.toString(),
      tags: ["one-tag", "two-tag", "red-tag", "blue-tag"],
      categories: ["one category", "two categories"],
      geo: {
        lat: 100,
        long: 100
      },
      contributors: [
        { first: "Dan", last: null },
        { first: null, last: "Ohara" },
        { first: "Godfrey", last: "Chan" }
      ]
    }
  );
});
