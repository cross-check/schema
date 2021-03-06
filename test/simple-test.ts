import { serialize } from "@cross-check/schema";
import {
  missingError,
  strip,
  typeError,
  validateDraft,
  validatePublished
} from "./support";
import { SimpleArticle } from "./support/schemas";

QUnit.module("@cross-check/schema - simple schema");

QUnit.test("string serialization", assert => {
  assert.equal(
    serialize(SimpleArticle),

    strip`
      {
        "hed": { "type": "SingleLine", "required": true },
        "dek": { "type": "Text", "required": false },
        "body": { "type": "Text", "required": true }
      }
    `
  );

  assert.equal(
    serialize(SimpleArticle.draft),

    strip`
      {
        "hed": { "type": "Text", "required": false },
        "dek": { "type": "Text", "required": false },
        "body": { "type": "Text", "required": false }
      }
    `
  );
});

QUnit.test("all fields are optional in draft mode", async assert => {
  assert.deepEqual(
    await validateDraft(SimpleArticle, {
      hed: null,
      dek: null,
      body: null
    }),
    [],
    "all fields can be null in drafts"
  );
});

QUnit.test("draft mode can accept the widened type", async assert => {
  assert.deepEqual(
    await validateDraft(SimpleArticle, {
      hed: "Hello world\nMultiline strings are allowed in SingleLine",
      dek: "Hello, the cool world!",
      body: null
    }),
    [],
    "draft mode can accept the widened type"
  );
});

QUnit.test("published drafts must be narrow", async assert => {
  assert.deepEqual(
    await validatePublished(SimpleArticle, {
      hed: "Hello world\nProblem here!",
      dek: "Hello, the cool world!",
      body: null
    }),
    [typeError("string:single-line", "hed"), missingError("body")],
    "published schemas must not be missing fields or have the widened type"
  );
});

QUnit.test("parsing", assert => {
  assert.deepEqual(
    SimpleArticle.parse({
      hed: "Hello world",
      body: "The body"
    }),
    {
      hed: "Hello world",
      dek: null,
      body: "The body"
    }
  );

  assert.deepEqual(
    SimpleArticle.parse({
      hed: "Hello world",
      dek: "Hello. Hello world.",
      body: "The body"
    }),
    {
      hed: "Hello world",
      dek: "Hello. Hello world.",
      body: "The body"
    }
  );
});

QUnit.test("serialize", assert => {
  assert.deepEqual(
    SimpleArticle.serialize({
      hed: "Hello world",
      dek: null,
      body: "The body"
    }),
    {
      hed: "Hello world",
      body: "The body"
    }
  );

  assert.deepEqual(
    SimpleArticle.serialize({
      hed: "Hello world",
      dek: "Hello. Hello world.",
      body: "The body"
    }),
    {
      hed: "Hello world",
      dek: "Hello. Hello world.",
      body: "The body"
    }
  );
});

QUnit.test("a valid published draft", async assert => {
  assert.deepEqual(
    await validatePublished(SimpleArticle, {
      hed: "Hello world",
      dek: "Hello, the cool world!\nMultiline allowed here",
      body: "Hello world.\nThis text is permitted.\nTotally fine."
    }),
    [],
    "a valid draft"
  );
});

QUnit.skip("Invalid shape", async assert => {
  assert.deepEqual(
    await validatePublished(SimpleArticle, false as any),
    [typeError("???", "*")],
    "wrong type"
  );

  assert.deepEqual(
    await validatePublished(SimpleArticle, [] as any),
    [typeError("???", "*")],
    "wrong type"
  );

  assert.deepEqual(
    await validatePublished(SimpleArticle, {}),
    [typeError("???", "*")],
    "empty object"
  );

  assert.deepEqual(
    await validatePublished(SimpleArticle, {
      hed: "Hello world",
      dek: "Hello, the cool world!"
    }),
    [typeError("???", "*")],
    "missing field"
  );

  assert.deepEqual(
    await validatePublished(SimpleArticle, {
      hed: "Hello world",
      dek: "Hello, the cool world!",
      body: "Hello!!!",
      wat: "dis"
    }),
    [typeError("???", "*")],
    "extra fields"
  );
});
