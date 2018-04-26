# Introduction

CrossCheck is a highly composable and ergonomic validation library.

It was extracted from Conde Nast CMS system, which supports more than 100 brands with similar, but not always identical validation requirements. This environment gives rise to significant extensibility requirements, so CrossCheck's primitives are designed with extensibility in mind.

All CrossCheck primitives produce well-typed, well-defined JSON objects. This is intended to allow applications to store schemas in a database or build UIs to generate them.

## Extensibility First

CrossCheck schemas can be **extended**. You can create a single base type that can be customized for different uses or by different brands in a larger organization.

CrossCheck schemas can be **evolved** without big-bang data migrations. Instead, data created under v1 of a schema can be viewed through the lens of v2 of the same schema. Schema evolution is baked into CrossCheck from the ground up.

CrossCheck schemas are **resilient** to old, invalid data or improperly imported data. Define fix-up rules for invalid data and CrossCheck can clean up broken data on the fly. No need to run migrations against all your old data or force every API client to harden itself against the possibility of broken data.

## Important Schema Features

- **Draft Mode**: Defining a schema automatically generates a "draft schema", to make it easier to save in-progress work that doesn't yet satisfy the strict schema requirements.
- **Rich Types**: Any concept that you can write a validation function for can be used as a schema type: URL, single word string, Date formatted as 8601, etc.
- **Composable Types**: Put types inside of lists or dictionaries, and get errors when the constituent parts are invalid.
- **Custom Types**: Turn any CrossCheck validator into a CrossCheck schema type.
- **TypeScript Support**: Turn any CrossCheck schema into a TypeScript interface.
- **Pretty Printing**: Use the CrossCheck formatter API to turn your schema into the format expected by another library. Need to generate MobX classes? Want to generate GraphQL schemas? No problem!

## Important Validator Features

- **Value-based**: Validate values, not just objects ("validate that this value is a titlecase string")
- **Async**: Validators can be async ("validate that this is a unique email address")
- **No exceptions**: Validators produce an error list and don't throw exceptions
- **Easy to Localize**: Validation errors are structured data, not an English string (so errors can be easily localized)
- **Composable**: Validators can be pipelined: "this type should not be null, and then it should be a string, and then it should be a valid email". Sub-validators can be reused, making it easier to build up larger validations and ensuring that errors have a consistent structure.
- **Framework Friendly**: Validation rules are agnostic to how properties are looked up inside of object (so they naturally support Immutable.js or other APIs that look up properties using `.get` or similar)
- **Pretty Printing**: CrossCheck can pretty-print validators for documentation and debugging
- A single validator can produce multiple errors
