import { toJSON } from "@cross-check/schema";
import { MediumArticle, Related, SimpleArticle } from "../support/schemas";

QUnit.module("formatting - toJSON");

QUnit.test("simple", assert => {
  assert.deepEqual(toJSON(SimpleArticle), {
    hed: { type: "SingleLine", required: true },
    dek: { type: "Text", required: false },
    body: { type: "Text", required: true }
  });

  assert.deepEqual(toJSON(SimpleArticle.draft), {
    hed: { type: "Text", required: false },
    dek: { type: "Text", required: false },
    body: { type: "Text", required: false }
  });
});

QUnit.test("detailed - published", assert => {
  let actual = toJSON(MediumArticle);
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
      of: {
        type: "SingleWord",
        required: true
      },
      required: false
    },
    categories: {
      type: "List",
      of: {
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
      of: {
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

QUnit.test("detailed - draft", assert => {
  let actual = toJSON(MediumArticle.draft);
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
      of: {
        type: "Text",
        // items inside lists are always required
        required: true
      },
      required: false
    },
    categories: {
      type: "List",
      of: {
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
      of: {
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

QUnit.test("relationships", assert => {
  assert.deepEqual(
    toJSON(Related),

    {
      first: { type: "SingleLine", required: false },
      last: { type: "Text", required: false },
      person: {
        type: "Pointer",
        kind: "hasOne",
        required: true,
        of: {
          name: "SimpleArticle",
          type: "dictionary",
          required: true
        }
      },
      articles: {
        type: "Iterator",
        kind: "hasMany",
        required: false,
        of: {
          name: "MediumArticle",
          type: "dictionary",
          required: true
        }
      }
    },
    "Related"
  );

  assert.deepEqual(
    toJSON(Related.draft),

    {
      first: { type: "Text", required: false },
      last: { type: "Text", required: false },
      person: {
        type: "Pointer",
        kind: "hasOne",
        required: false,
        of: {
          name: "SimpleArticle",
          type: "dictionary",
          required: true
        }
      },
      articles: {
        type: "Iterator",
        kind: "hasMany",
        required: false,
        of: {
          name: "MediumArticle",
          type: "dictionary",
          required: true
        }
      }
    },
    "Related.draft"
  );
});
