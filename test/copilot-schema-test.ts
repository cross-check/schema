import { ValidationError } from "@cross-check/core";
import {
  Dictionary,
  Record,
  Schema,
  describe,
  types,
  typescript
} from "copilot-schema";
import { Task } from "no-show";
import { Dict, unknown } from "ts-std";
import { ISODate } from "./support";
import { Url } from "./url";

const { SingleLine, Text, List, Num } = types;

QUnit.module("copilot-schema - simple schema");

const SIMPLE = new Schema("simple-article", {
  hed: SingleLine().required(),
  dek: Text(),
  body: Text().required()
});

function validateDraft(
  schema: Schema,
  obj: Dict<unknown>
): Task<ValidationError[]> {
  return schema.draft.validate(obj, ENV);
}

function validatePublished(
  schema: Schema,
  obj: Dict<unknown>
): Task<ValidationError[]> {
  return schema.validate(obj, ENV);
}

function typeError(kind: string, path: string) {
  return { message: { args: kind, key: "type" }, path: path.split(".") };
}

function missingError(path: string) {
  return typeError("present", path);
}

function error(kind: string, problem: unknown, path: string) {
  return { message: { args: problem, key: kind }, path: path.split(".") };
}

QUnit.test("labels", assert => {
  assert.equal(
    describe(SIMPLE.label),
    `{\n  hed: <single line string>,\n  dek?: <string>,\n  body: <string>\n}`
  );

  assert.equal(
    describe(SIMPLE.draft.label),
    `{\n  hed?: <string>,\n  dek?: <string>,\n  body?: <string>\n}`
  );

  assert.equal(
    typescript(SIMPLE.label),
    `{\n  hed: string,\n  dek?: string,\n  body: string\n}`
  );

  assert.equal(
    typescript(SIMPLE.draft.label),
    `{\n  hed?: string,\n  dek?: string,\n  body?: string\n}`
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

const ENV = {
  get(object: unknown, key: string): unknown {
    if (object === null || object === undefined) return;
    return (object as Dict<unknown>)[key];
  }
};

QUnit.module("copilot-schema - detailed schema");

const DETAILED = new Schema("medium-article", {
  hed: SingleLine().required(),
  dek: Text(),
  body: Text().required(),
  author: Dictionary({ first: SingleLine(), last: SingleLine() }),
  issueDate: ISODate(),
  canonicalUrl: Url(),
  tags: List(SingleLine()),
  categories: List(SingleLine()).required(),
  geo: Dictionary({ lat: Num().required(), long: Num().required() })
});

QUnit.test("labels", assert => {
  assert.equal(
    describe(DETAILED.label),
    `{\n  hed: <single line string>,\n  dek?: <string>,\n  body: <string>\n}`
  );

  assert.equal(
    describe(DETAILED.draft.label),
    `{\n  hed?: <string>,\n  dek?: <string>,\n  body?: <string>\n}`
  );

  assert.equal(
    typescript(DETAILED.label),
    `{\n  hed: string,\n  dek?: string,\n  body: string\n}`
  );

  assert.equal(
    typescript(DETAILED.draft.label),
    `{\n  hed?: string,\n  dek?: string,\n  body?: string\n}`
  );
});

QUnit.test(
  "missing fields (including dictionaries with required fields inside and required arrays)",
  async assert => {
    assert.deepEqual(
      await validateDraft(DETAILED, {}),
      [],
      "draft schemas can be missing fields"
    );
  }
);

QUnit.test("drafts", async assert => {
  assert.deepEqual(
    await validateDraft(DETAILED, {
      hed: "Not\nactually\na\nsingle\nline",
      canonicalUrl: "totally -- invalid :: url"
    }),
    [],
    "can be missing fields"
  );

  assert.deepEqual(
    await validateDraft(DETAILED, {
      categories: []
    }),
    [],
    "can supply empty arrays for required arrays"
  );

  assert.deepEqual(
    await validateDraft(DETAILED, {
      categories: ["This\nis\na multiline\nstring"]
    }),
    [],
    "arrays use the draft type of their members"
  );
});

QUnit.test("published documents", async assert => {
  assert.deepEqual(
    await validatePublished(DETAILED, {
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
    await validatePublished(DETAILED, {
      hed: "A single line",
      body: "Hello world\nMore content",
      tags: [1, "tag", {}],
      categories: ["single"]
    }),
    [typeError("string", "tags.0"), typeError("string", "tags.2")],
    "if an optional field is present, it must match the schame"
  );
});

QUnit.dump.maxDepth = 100;

QUnit.test("dates (issueDate)", async assert => {
  assert.deepEqual(
    await validateDraft(DETAILED, {
      issueDate: "not -- a valid :: date"
    }),
    [typeError("iso-date", "issueDate")],
    "dates don't widen into strings for drafts"
  );

  assert.deepEqual(
    await validatePublished(DETAILED, {
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
    await validateDraft(DETAILED, {
      geo: {}
    }),
    [],
    "drafts do not need nested required fields"
  );

  assert.deepEqual(
    await validatePublished(DETAILED, {
      hed: "A single line",
      body: "Hello world\nMore content",
      geo: {},
      categories: ["single"]
    }),
    [missingError("geo.lat"), missingError("geo.long")],
    "published documents must include nested required fields if dictionary is present"
  );

  assert.deepEqual(
    await validatePublished(DETAILED, {
      hed: "A single line",
      body: "Hello world\nMore content",
      categories: ["single"]
    }),
    [],
    "published documents may leave out optional dictionaries"
  );

  assert.deepEqual(
    await validatePublished(DETAILED, {
      hed: "A single line",
      body: "Hello world\nMore content"
    }),
    [missingError("categories")],
    "published documents may not leave out required dictionaries"
  );

  assert.deepEqual(
    await validateDraft(DETAILED, {
      geo: { lat: "10", long: "20" }
    }),
    [typeError("number", "geo.lat"), typeError("number", "geo.long")],
    "nested fields in drafts use the draft type (but numbers still are't strings)"
  );

  assert.deepEqual(
    await validatePublished(DETAILED, {
      hed: "A single line",
      body: "Hello world\nMore content",
      geo: { lat: "10", long: "20" },
      categories: ["single"]
    }),
    [typeError("number", "geo.lat"), typeError("number", "geo.long")],
    "nested fields in published documents use the schema type (but numbers aren't strings)"
  );

  assert.deepEqual(
    await validateDraft(DETAILED, {
      author: { first: "Christina\nTODO: Check", last: "Kung" }
    }),
    [],
    "nested fields in drafts use the draft type (multiline strings are accepted for single-line strings)"
  );

  assert.deepEqual(
    await validatePublished(DETAILED, {
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
    await validateDraft(DETAILED, {
      geo: {}
    }),
    [],
    "drafts do not need nested required fields"
  );

  assert.deepEqual(
    await validatePublished(DETAILED, {
      hed: "A single line",
      body: "Hello world\nMore content",
      geo: {},
      categories: ["single"]
    }),
    [missingError("geo.lat"), missingError("geo.long")],
    "published documents must include nested required fields if dictionary is present"
  );

  assert.deepEqual(
    await validatePublished(DETAILED, {
      hed: "A single line",
      body: "Hello world\nMore content",
      categories: ["single"]
    }),
    [],
    "published documents may leave out optional dictionaries"
  );

  assert.deepEqual(
    await validatePublished(DETAILED, {
      hed: "A single line",
      body: "Hello world\nMore content"
    }),
    [missingError("categories")],
    "published documents may not leave out required dictionaries"
  );

  assert.deepEqual(
    await validateDraft(DETAILED, {
      geo: { lat: "10", long: "20" }
    }),
    [typeError("number", "geo.lat"), typeError("number", "geo.long")],
    "nested fields in drafts use the draft type (but numbers still are't strings)"
  );

  assert.deepEqual(
    await validatePublished(DETAILED, {
      hed: "A single line",
      body: "Hello world\nMore content",
      geo: { lat: "10", long: "20" },
      categories: ["single"]
    }),
    [typeError("number", "geo.lat"), typeError("number", "geo.long")],
    "nested fields in published documents use the schema type (but numbers aren't strings)"
  );

  assert.deepEqual(
    await validateDraft(DETAILED, {
      author: { first: "Christina\nTODO: Check", last: "Kung" }
    }),
    [],
    "nested fields in drafts use the draft type (multiline strings are accepted for single-line strings)"
  );

  assert.deepEqual(
    await validatePublished(DETAILED, {
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
    await validatePublished(DETAILED, {
      hed: "A single line",
      body: "Hello world\nMore content",
      geo: { lat: 10, long: 20 },
      categories: []
    }),
    [typeError("present-array", "categories")],
    "in published documents, required lists must have at least one element"
  );

  assert.deepEqual(
    await validateDraft(DETAILED, {
      hed: "A single line",
      body: "Hello world\nMore content",
      geo: { lat: 10, long: 20 },
      categories: []
    }),
    [],
    "in drafts, required lists may be empty"
  );

  assert.deepEqual(
    await validatePublished(DETAILED, {
      hed: "A single line",
      body: "Hello world\nMore content",
      geo: { lat: 10, long: 20 }
    }),
    [typeError("present", "categories")],
    "in published documents, required lists may not be missing"
  );

  assert.deepEqual(
    await validateDraft(DETAILED, {
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
    await validatePublished(DETAILED, {
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
    await validateDraft(DETAILED, {
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
    await validatePublished(DETAILED, {
      hed: "A single line",
      body: "Hello world\nMore content",
      geo: { lat: 10, long: 20 },
      categories: ["somecategory"]
    }),
    [],
    "in published documents, optional lists may be missing"
  );

  assert.deepEqual(
    await validateDraft(DETAILED, {
      hed: "A single line",
      body: "Hello world\nMore content",
      categories: ["somecategory"],
      geo: { lat: 10, long: 20 }
    }),
    [],
    "in drafts, optional lists may be missing"
  );
});

QUnit.module("Records");

QUnit.test("optional records (geo)", async assert => {
  const RECORDS = new Schema("records", {
    geo: Record({ lat: Num(), long: Num() })
  });

  assert.deepEqual(
    await validateDraft(RECORDS, {}),
    [],
    "drafts do not need optional records"
  );

  assert.deepEqual(
    await validatePublished(DETAILED, {
      hed: "A single line",
      body: "Hello world\nMore content",
      geo: {},
      categories: ["single"]
    }),
    [missingError("geo.lat"), missingError("geo.long")],
    "published documents must include nested required fields if dictionary is present"
  );

  assert.deepEqual(
    await validatePublished(DETAILED, {
      hed: "A single line",
      body: "Hello world\nMore content",
      categories: ["single"]
    }),
    [],
    "published documents may leave out optional dictionaries"
  );

  assert.deepEqual(
    await validatePublished(DETAILED, {
      hed: "A single line",
      body: "Hello world\nMore content"
    }),
    [missingError("categories")],
    "published documents may not leave out required dictionaries"
  );

  assert.deepEqual(
    await validateDraft(DETAILED, {
      geo: { lat: "10", long: "20" }
    }),
    [typeError("number", "geo.lat"), typeError("number", "geo.long")],
    "nested fields in drafts use the draft type (but numbers still are't strings)"
  );

  assert.deepEqual(
    await validatePublished(DETAILED, {
      hed: "A single line",
      body: "Hello world\nMore content",
      geo: { lat: "10", long: "20" },
      categories: ["single"]
    }),
    [typeError("number", "geo.lat"), typeError("number", "geo.long")],
    "nested fields in published documents use the schema type (but numbers aren't strings)"
  );

  assert.deepEqual(
    await validateDraft(DETAILED, {
      author: { first: "Christina\nTODO: Check", last: "Kung" }
    }),
    [],
    "nested fields in drafts use the draft type (multiline strings are accepted for single-line strings)"
  );

  assert.deepEqual(
    await validatePublished(DETAILED, {
      hed: "A single line",
      author: { first: "Christina\nTODO: Check", last: "Kung" },
      body: "Hello world\nMore content",
      categories: ["single"]
    }),
    [typeError("string:single-line", "author.first")],
    "nested fields in published documents use the schema type (multiline strings are not valid single-line strings)"
  );
});

QUnit.test("required records (geo)", async assert => {
  const RECORDS = new Schema("records", {
    geo: Record({ lat: Num(), long: Num() }).required()
  });

  assert.deepEqual(
    await validateDraft(RECORDS, {}),
    [],
    "drafts do not need optional records"
  );

  assert.deepEqual(
    await validatePublished(DETAILED, {
      hed: "A single line",
      body: "Hello world\nMore content",
      categories: ["single"]
    }),
    [missingError("geo")],
    "published documents must include nested required fields if dictionary is present"
  );

  assert.deepEqual(
    await validatePublished(DETAILED, {
      hed: "A single line",
      body: "Hello world\nMore content",
      geo: {},
      categories: ["single"]
    }),
    [missingError("geo.lat"), missingError("geo.long")],
    "published documents must include nested required fields if dictionary is present"
  );

  assert.deepEqual(
    await validatePublished(DETAILED, {
      hed: "A single line",
      body: "Hello world\nMore content",
      categories: ["single"]
    }),
    [],
    "published documents may leave out optional dictionaries"
  );

  assert.deepEqual(
    await validatePublished(DETAILED, {
      hed: "A single line",
      body: "Hello world\nMore content"
    }),
    [missingError("categories")],
    "published documents may not leave out required dictionaries"
  );

  assert.deepEqual(
    await validateDraft(DETAILED, {
      geo: { lat: "10", long: "20" }
    }),
    [typeError("number", "geo.lat"), typeError("number", "geo.long")],
    "nested fields in drafts use the draft type (but numbers still are't strings)"
  );

  assert.deepEqual(
    await validatePublished(DETAILED, {
      hed: "A single line",
      body: "Hello world\nMore content",
      geo: { lat: "10", long: "20" },
      categories: ["single"]
    }),
    [typeError("number", "geo.lat"), typeError("number", "geo.long")],
    "nested fields in published documents use the schema type (but numbers aren't strings)"
  );

  assert.deepEqual(
    await validateDraft(DETAILED, {
      author: { first: "Christina\nTODO: Check", last: "Kung" }
    }),
    [],
    "nested fields in drafts use the draft type (multiline strings are accepted for single-line strings)"
  );

  assert.deepEqual(
    await validatePublished(DETAILED, {
      hed: "A single line",
      author: { first: "Christina\nTODO: Check", last: "Kung" },
      body: "Hello world\nMore content",
      categories: ["single"]
    }),
    [typeError("string:single-line", "author.first")],
    "nested fields in published documents use the schema type (multiline strings are not valid single-line strings)"
  );
});
