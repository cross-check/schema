import { serialize } from "@cross-check/schema";
import {
  missingError,
  strip,
  typeError,
  validateDraft,
  validatePublished
} from "./support";
import { SIMPLE } from "./support/schemas";

QUnit.module("@cross-check/schema - simple schema");

QUnit.test("string serialization", assert => {
  assert.equal(
    serialize(SIMPLE),

    strip`
      {
        "hed": { "type": "SingleLine", "details": [], "required": true },
        "dek": { "type": "Text", "details": [], "required": false },
        "body": { "type": "Text", "details": [], "required": true }
      }
    `
  );

  assert.equal(
    serialize(SIMPLE.draft),

    strip`
      {
        "hed": { "type": "Text", "details": [], "required": false },
        "dek": { "type": "Text", "details": [], "required": false },
        "body": { "type": "Text", "details": [], "required": false }
      }
    `
  );
});

QUnit.test("missing fields", async assert => {
  assert.deepEqual(
    await validateDraft(SIMPLE, {}),
    [],
    "draft schemas can be missing fields"
  );
});

QUnit.test("type widening works", async assert => {
  assert.deepEqual(
    await validateDraft(SIMPLE, {
      hed: "Hello world\nNo problem here",
      dek: "Hello, the cool world!"
    }),
    [],
    "draft schemas can be missing fields"
  );
});

QUnit.test("published drafts must be narrow", async assert => {
  assert.deepEqual(
    await validatePublished(SIMPLE, {
      hed: "Hello world\nProblem here!",
      dek: "Hello, the cool world!"
    }),
    [typeError("string:single-line", "hed"), missingError("body")],
    "published schemas must not be missing fields or have the widened type"
  );
});

QUnit.test("parsing", assert => {
  assert.deepEqual(
    SIMPLE.parse({
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
    SIMPLE.parse({
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
    SIMPLE.serialize({
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
    SIMPLE.serialize({
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
    await validatePublished(SIMPLE, {
      hed: "Hello world",
      dek: "Hello, the cool world!\nMultiline allowed here",
      body: "Hello world.\nThis text is permitted.\nTotally fine."
    }),
    [],
    "a valid draft"
  );
});
