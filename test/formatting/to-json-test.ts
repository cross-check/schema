import { toJSON } from "@cross-check/schema";
import { DETAILED, SIMPLE } from "../support/schemas";

QUnit.module("formatting - toJSON");

QUnit.test("simple", assert => {
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

QUnit.test("detailed - published", assert => {
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

QUnit.test("detailed - draft", assert => {
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
