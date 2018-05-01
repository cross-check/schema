import { ValidationError } from "@cross-check/core";
import {
  Schema,
  describe,
  graphql,
  listTypes,
  schemaFormat,
  serialize,
  toJSON,
  types,
  typescript
} from "@cross-check/schema";
import { Task } from "no-show";
import { Dict, unknown } from "ts-std";
import { ISODate } from "./support";
import { Url, urlish } from "./url";

QUnit.module("@cross-check/schema - simple schema");

const SIMPLE = new Schema("simple-article", {
  hed: types.SingleLine().required(),
  dek: types.Text(),
  body: types.Text().required()
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

function typeError(kind: string, path: string): ValidationError {
  return { message: { details: kind, name: "type" }, path: path.split(".") };
}

function missingError(path: string) {
  return typeError("present", path);
}

function error(kind: string, problem: unknown, path: string): ValidationError {
  return { message: { details: problem, name: kind }, path: path.split(".") };
}

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

QUnit.test("JSON serialization", assert => {
  assert.deepEqual(toJSON(SIMPLE), {
    hed: { type: "SingleLine", required: true },
    dek: { type: "Text", required: false },
    body: { type: "Text", required: true }
  });

  assert.deepEqual(toJSON(SIMPLE.draft), {
    hed: { type: "Text", required: false },
    dek: { type: "Text", required: false },
    body: { type: "Text", required: false }
  });
});

QUnit.test("List types", assert => {
  assert.deepEqual(listTypes(SIMPLE), ["SingleLine", "Text"]);
});

const GRAPHQL_SCALAR_MAP = {
  // Custom scalars
  SingleLine: "SingleLine",
  SingleWord: "SingleWord",
  ISODate: "ISODate",
  Url: "Url",

  Text: "String",
  Integer: "Int",
  Number: "Float",
  Boolean: "Boolean"
};

function strip(
  strings: TemplateStringsArray,
  ...expressions: unknown[]
): string {
  let result = strings
    .map((s, i) => `${s}${expressions[i] ? expressions[i] : ""}`)
    .join("");

  let lines = result.split("\n").slice(1, -1);

  let leading = lines.reduce((accum, line) => {
    let size = line.match(/^(\s*)/)![1].length;
    return Math.min(accum, size);
  }, Infinity);

  lines = lines.map(l => l.slice(leading));

  return lines.join("\n");
}

QUnit.test("graphql", assert => {
  assert.equal(
    graphql(SIMPLE, { name: "Simple", scalarMap: GRAPHQL_SCALAR_MAP }),
    strip`
      type Simple {
        hed: SingleLine!
        dek: String
        body: String!
      }
    `
  );

  assert.equal(
    graphql(SIMPLE.draft, { name: "Simple", scalarMap: GRAPHQL_SCALAR_MAP }),
    strip`
      type Simple {
        hed: String
        dek: String
        body: String
      }
    `
  );
});

QUnit.test("labels", assert => {
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

QUnit.test("typescript", assert => {
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

const ENV = {
  get(object: unknown, key: string): unknown {
    if (object === null || object === undefined) return;
    return (object as Dict<unknown>)[key];
  }
};

QUnit.module("@cross-check/schema - detailed schema");

const DETAILED = new Schema("medium-article", {
  hed: types.SingleLine().required(),
  dek: types.Text(),
  body: types.Text().required(),
  author: types.Dictionary({
    first: types.SingleLine(),
    last: types.SingleLine()
  }),
  issueDate: ISODate(),
  canonicalUrl: Url(),
  tags: types.List(types.SingleWord()),
  categories: types.List(types.SingleLine()).required(),
  geo: types.Dictionary({
    lat: types.Integer().required(),
    long: types.Integer().required()
  }),
  contributors: types.List(
    types.Dictionary({ first: types.SingleLine(), last: types.SingleLine() })
  )
});

QUnit.test("List types", assert => {
  assert.deepEqual(listTypes(DETAILED), [
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

QUnit.test("GraphQL", assert => {
  assert.equal(
    graphql(DETAILED, { name: "MediumArticle", scalarMap: GRAPHQL_SCALAR_MAP }),

    strip`
    type MediumArticle_author {
      first: SingleLine
      last: SingleLine
    }
    
    type MediumArticle_geo {
      lat: Int!
      long: Int!
    }
    
    type MediumArticle_contributors {
      first: SingleLine
      last: SingleLine
    }
    
    type MediumArticle {
      hed: SingleLine!
      dek: String
      body: String!
      author: MediumArticle_author
      issueDate: ISODate
      canonicalUrl: Url
      tags: [SingleWord!]
      categories: [SingleLine!]!
      geo: MediumArticle_geo
      contributors: [MediumArticle_contributors!]
    }
    `
  );
});

QUnit.test("JSON serialized - published", assert => {
  let actual = toJSON(DETAILED);
  let expected = {
    hed: { type: "SingleLine", required: true },
    dek: { type: "Text", required: false },
    body: { type: "Text", required: true },
    author: {
      type: "Dictionary",
      members: {
        first: { type: "SingleLine", required: false },
        last: { type: "SingleLine", required: false }
      },
      required: false
    },

    issueDate: { type: "ISODate", required: false },
    canonicalUrl: { type: "Url", required: false },
    tags: {
      type: "List",
      items: {
        type: "SingleWord",
        required: true
      },
      required: false
    },
    categories: {
      type: "List",
      items: {
        type: "SingleLine",
        required: true
      },
      required: true
    },
    geo: {
      type: "Dictionary",
      members: {
        lat: { type: "Integer", required: true },
        long: { type: "Integer", required: true }
      },
      required: false
    },
    contributors: {
      type: "List",
      required: false,
      items: {
        type: "Dictionary",
        // list items are always required
        required: true,
        members: {
          first: { type: "SingleLine", required: false },
          last: { type: "SingleLine", required: false }
        }
      }
    }
  };

  assert.deepEqual(actual, expected);
});

QUnit.test("JSON serialized - draft", assert => {
  let actual = toJSON(DETAILED.draft);
  let expected = {
    hed: { type: "Text", required: false },
    dek: { type: "Text", required: false },
    body: { type: "Text", required: false },
    author: {
      type: "Dictionary",
      members: {
        first: { type: "Text", required: false },
        last: { type: "Text", required: false }
      },
      required: false
    },

    issueDate: { type: "ISODate", required: false },
    canonicalUrl: { type: "Text", required: false },
    tags: {
      type: "List",
      items: {
        type: "Text",
        // items inside lists are always required
        required: true
      },
      required: false
    },
    categories: {
      type: "List",
      items: {
        type: "Text",
        required: true
      },
      required: false
    },
    geo: {
      type: "Dictionary",
      members: {
        lat: { type: "Integer", required: false },
        long: { type: "Integer", required: false }
      },
      required: false
    },
    contributors: {
      type: "List",
      required: false,
      items: {
        type: "Dictionary",
        required: true,
        members: {
          first: { type: "Text", required: false },
          last: { type: "Text", required: false }
        }
      }
    }
  };

  assert.deepEqual(actual, expected);
});

QUnit.test("pretty printed", assert => {
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
});

QUnit.test("pretty printed draft", assert => {
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

QUnit.test("typescript", assert => {
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
});

QUnit.test("typescript draft", assert => {
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

QUnit.test("round trip", assert => {
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

QUnit.test("round trip draft", assert => {
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
    await validatePublished(DETAILED, {
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

QUnit.test("parsing", assert => {
  assert.deepEqual(
    DETAILED.parse({
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
    DETAILED.parse({
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
    DETAILED.parse({
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
    DETAILED.serialize({
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
    DETAILED.serialize({
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
    DETAILED.serialize({
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

QUnit.test("List types", assert => {
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

QUnit.test("labels", assert => {
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

  assert.equal(
    schemaFormat(RECORDS),

    // prettier-ignore
    prettyPrint({
      geo: ["Dictionary(", {
        lat: "Number().required()",
        long: "Number().required()"
      }, ")"],
      author: ["Dictionary(", {
        first: "SingleLine().required()",
        last: "SingleLine().required()"
      }, ").required()"],
      date: "ISODate()"
    })
  );

  assert.equal(
    schemaFormat(RECORDS.draft),

    // prettier-ignore
    prettyPrint({
      geo: ["Dictionary(", {
        lat: "Number()",
        long: "Number()"
      }, ")"],
      author: ["Dictionary(", {
        first: "Text()",
        last: "Text()"
      }, ")"],
      date: "ISODate()"
    })
  );
});

type Value = string | ValueDict | ValueArray;
interface ValueDict extends Dict<Value> {}
interface ValueArray extends Array<Value> {}

export interface PrettyPrintOptions {
  sep?: string;
  sepOnLast?: boolean;
  pad?: number;
  stringifyKeys?: boolean;
}

function prettyPrint(
  value: Value,
  {
    sep = ",",
    sepOnLast = false,
    pad = 2,
    stringifyKeys = false
  }: PrettyPrintOptions = {}
): string {
  if (typeof value === "string") {
    return value;
  } else if (Array.isArray(value)) {
    let out = value.map(v => prettyPrint(v, { sep, sepOnLast, pad }));
    return out.join("");
  } else {
    let out = "{\n";

    let keys = Object.keys(value);
    let last = keys.length - 1;

    keys.forEach((key, i) => {
      let k = stringifyKeys ? JSON.stringify(key) : key;
      out += `${" ".repeat(pad)}${k}: `;
      out += prettyPrint(value[key]!, { sep, sepOnLast, pad: pad + 2 });

      if (last !== i || sepOnLast) {
        out += sep;
      }

      out += "\n";
    });

    out += `${" ".repeat(pad - 2)}}`;

    return out;
  }
}
