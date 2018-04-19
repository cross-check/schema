# @cross-check/schema

Crosscheck Schemas allow you to define a schema for your data and use the schema to validate the data.

Uniquely, it allows you to differentiate between "draft" data and published data without creating two separate schema definitions.

For example, if a field in your schema has the "URL" type, you can allow that field to hold any string while the record is being drafted.

This reduces friction when saving initial drafts of content types. It also makes it easy to implement "auto-save", which is optimized for saving in-progress data.

# Basic Usage

First, let's define a schema.

```ts
import { Schema, type } from "@cross-check/schema";

const schema = new Schema({
  // SingleLine is a string that contains no newlines.
  // Required means that the field must not be missing
  title: type.SingleLine().required(),
  subtitle: type.SingleLine(),

  // Text is a string that can contain newlines
  body: type.Text().required(),

  // SingleWord is a string with no whitespace at all
  tags: type.List(type.SingleWord()),

  geo: Dictionary({
    lat: Num().required(),
    long: Num().required()
  })
});
```

Now, let's try to validate some content:

```ts
> schema.validate({});
[{
  message: { key: "type", args: "present" },
  path: ["title"]
}, {
  message: { key: "type", args: "present" },
  path: ["body"]
}]
```

The first thing to notice here is that Crosscheck returns a list of errors, rather than raising an exception. This allows you to use these errors in an interactive UI, and provide richer error information over web services.

Additionally, Crosscheck errors are returned as data: a kind of error and the arguments to the validation. This allows you to present the errors in using application-appropriate language, as well as properly internationalize error messages.

Under the hood, Crosscheck Schema uses the advanced `@cross-check/core` validation library to validate objects, a validation library extracted from the real-world requirements of the Conde Nast CMS. Its compositional, asynchronous core makes it a perfect fit for validating schemas with embedded lists and dictionaries. To learn more about the philosophy and mechanics of Crosscheck Validations, check out its [README][cross-check-core-readme].

[cross-check-core-readme]: https://github.com/cross-check/core/blob/master/README.md

## Drafts

The schema we wrote is pretty strict. It absolutely requires a title and body. But when we're drafting an article, we don't want to be bothered with this kind of busywork just to save in-progress content. And worse, how could we implement auto-save for our form if our authors need to fix a bunch of validation errors before they can even get off the ground.

To solve this problem, every schema creates a looser "draft" schema at the same time.

```ts
> schema.draft.validate({});
[]
```

Because we're validating the draft version of the schema, a completely empty document is totally fine.

But not any kind of document will validate in the draft schema.

```ts
> schema.draft.validate({ title: 12, geo: { lat: "100", long: "50" } });
[{
  message: { key: "type", args: "string" },
  path: ["title"]
}, {
  message: { key: "type", args: "number" },
  path: ["geo", "lat"]
}, {
  message: { key: "type", args: "number" },
  path: ["geo", "long"]
}]
```

Even though we are generally loose with the kind of document we're willing to accept as a draft, we're still expected to pass the right basic data types if we send anything at all.

The philosophy of drafts comes from two observations:

* We want to allow clients to send in-progress data that the user hasn't finished filling out, but the user is not responsible for picking the data type. For example, if a field is supposed to be a number, the client should user an appropriate number field, and pass a number back to the server.
* Servers need to store data in data stores (like relational databases) that apply some structure to the data. As a result, even when clients send drafts to the server, we want to be able to impose some constraints on the form of the data.

To give a concrete example, consider a `Url` type that requires that its data is a valid URL. That type allows any string at all to be provided when used in draft mode. This satisfies the "auto-save" heuristic: the end user can type any text into the text box provided by the CMS, and we want to be able to save a draft even during this period.

# Required and Optional Fields

As the above example illustrated, you can mark any field as required. If a field is not marked as required, it is optional.

```ts
import { Schema, type } from "@cross-check/schema";

const Person = new Schema({
  first: type.SingleLine().required(),
  middle: type.SingleLine(),
  last: type.SingleLine().required()
});
```

This `Person` schema requires a first and last name, but makes the middle name optional.

```ts
> Person.validate({})
[{
  message: { key: "first", args: "present" },
  path: ["title"]
}, {
  message: { key: "last", args: "present" },
  path: ["body"]
}]

> Person.draft.validate({})
[]

> Person.validate({ first: "Christina", last: "Kung" })
[]

> Person.validate({ first: "Christina", middle: "multi\nline", last: "Kung" })
[{
  message: { key: "type", args: "string:single-line" },
  path: ["middle"]
}]

> Person.draft.validate({ first: "Christina", middle: "multi\nline", last: "Kung" })
[] // the draft version of a single-line string is any string

> Person.draft.validate({ first: "Christina", middle: 12, last: "Kung" })
[{
  message: { key: "type", args: "string" },
  path: ["middle"]
}] // but you still can't pass a number
```

# Lists

# Dictionaries

# Custom Types

# Formatters