# Philosophy

CrossCheck's primary goal is to create a highly composable and ergonomic validation system.

## High Level Architecture

The data structures and core functions are found in `@cross-check/core` to create a small, well-defined composition boundary. The primary data structure in `@cross-check/core` is `ValidationDescriptor`.

Higher level tools for building up validations are found in `@cross-check/dsl`. Validators written against the interfaces in `@cross-check/core` will compose reliably with validators created using the higher level abstractions (including the object oriented abstractions).

Finally, while `@cross-check/core` and `@cross-check/dsl` validate values, `@cross-check/schema` validates entire records against a schema, with facilities optimized for that use case. The `@cross-check/schema` library also creates `ValidationDescriptor`, and the errors produced when validating a schema are the same `ValidationError`s in `@cross-check/core`.

## TypeScript Hardened

CrossCheck defines a handful of core, composable interfaces that are defined rigorously in TypeScript. Convenience abstractions are layered on top, sharing a stable core primitive.

```ts
// A validation descriptor is an instance of a validator including a descriptive
// name and its options
interface ValidationDescriptor<T, Options> {
  name: string;
  validator(options: Options): Validator<T>;
  options: Options;
}

// A validator is a function that takes a value and produces (asynchronously)
// a list of validation errors.
type Validator<T> = (value: T) => Promise<ValidationError[]>;

// A validation error is a path to error and an error message, which contains
// the name of the error and additional details provided by the validator.
interface ValidationError {
  path: string[];
  message: {
    name: string;
    details: unknown;
  }
}
```

## Composition at the Core

The CrossCheck core data structure is called `ValidationDescriptor`, and its goal is to provide a highly composable but relatively unopinionated primitive for building composed validators.

### Validate Values

At the core, CrossCheck validates individual values, not a bunch of fields on an object.

This makes it possible to validate that a single string matches a particular format, or that a number is greater than some lower bound.

To validate an object, CrossCheck validates the object as a "value" and uses composition to validate its constituent parts. Several design decisions of the core data structure make such composition possible:

- A single validator can return **any number of errors**. This makes it possible for a single validator to run sub-validators on sub-parts of the object in question.
- Validation errors **include a path** member, which provides the path to the place where the error occurred. Validations that validate sub-properties, like the object or array validator, prepend the path that they plucked off. This also allows arbitrary nesting: each validator that plucks off a sub-part of an object prepends the path it added.

These design decisions also make array validations relatively consistent: an array validator runs the same sub-validator on every element of the array, and produces an error whose path is the index into the array.

This makes validating an array of objects containing members that are **themselves arrays of objects** a standard composition in CrossCheck.

**There is no distinction between a "single value" and an object or array.** A value is a value is a value. Composition takes care of the rest.

### No Exceptions and No Mutation

CrossCheck validations are functional, not effectful.

CrossCheck never mutates the underlying objects in order to validate them or report errors. It also does not throw exceptions in order to report validation errors like many schema validation libraries.

The CrossCheck validation process **reads data** from objects and produces an array of error messages.

### Localization Agnostic, But Formatting Friendly

Validation libraries usually make formatting a responsibility of individual validators.

This forces a hard choice between bad options:

- provide no localization solution at all
- hardcode support for a specific localization library
- force people to write new implementations of the validations for each localization solution they want to use

The CrossCheck validation function produces a data structure containing enough information to create localized, formatted error messages, rather than making formatting an additional responsibility of validators.

```json
[{
  "path": ["lat"],
  "message": {
    "key": "gt",
    "args": { "expected": 0, "actual": -50 }
  }
}]
```

Validators themselves are responsible for producing these error message data structures, but not for formatting. This allows validators to remain compact and still relatively easy to write, while allowing for robust and high-quality localizations.

In practice, higher-level libraries written on top of these primitives should expose integration with localization libraries, but validators themselves can remain agnostic to those questions.

### UI Friendly

A good validation library provides rich error information to a human end-user, typically presented via an interactive UI.

This means that attempting to validate an entire object must:

- produce a list of validation errors
- identify precisely where the validation errors occured in a way that is consumable by an interactive UI
- provide the error messages in a format that can be localized into various languages and contexts

This stands in contrast with traditional schema libraries, which usually assume that they are validating data against programmer error, and accept or reject entire entities.

CrossCheck schemas are built on top of the CrossCheck validation primitive, which means that when a document fails to validate, you get a list of rich errors back that can be presented to an end user.

In our original design exploration for CrossCheck, we wrote:

> The accurate placement of errors in a form (a UI concern!) is a key requirement of a good validation library.

This is still a good guiding principle for CrossCheck. **A good validation library cannot avoid considering UI concerns in its core design.**

### Framework Agnostic, But Framework Friendly

CrossCheck was extracted from the requirements of a working validation system that powered Condé Nast's CMS, which is written in Ember.

One of the main goals of the extraction was to allow people to define validation rules for their forms without needing to understand Ember or its object model.

However, we wanted to make it possible to write validators that could be shared between vanilla environments and frameworks.

This mostly amounts to two concerns.

*First*, applications should be able to expose well-defined "services" to validations. If a validator depends on such a service, and somebody wants to use the validator in a different environment (such as React Native), they will have a clear, pure-JavaScript definition of what they will need to implement.

In practice, this means that integrations can expose things like a configuration service or feature flagging infrastructure.

*Second*, it should be possible to write a validator that looks up properties on an object, agnostic to how those properties should be looked up. For example, looking up a property in an Immutable.js Map requires the user to use .get(). Knockout turns computed getters into functions (to look up firstName on a Person object, you say person.firstName()).

In the case of both of these issues (services and getters), the philosophy of CrossCheck is to expose hooks on an "Environment" that framework integrators can use to abstract these distinctions. Validators receive this environment as a parameter, and if validator definitions work through the Environment (e.g. looking up properties by using environment.get rather than direct indexing), they will be reusable in more environments and with more kinds of data structures.

Because it can be difficult to remember to work through the environment all the time, the @cross-check/dsl library provides a number of abstractions that do the work for you. For example, the object() validator provided by @cross-check/dsl automatically looks up sub-properties by using environment.get.

