Extending implies you can upcast and downcast.

Use case: VFArticle extends Article

This is important for syndication: VFArticle can be presented in WiredArticle by upcasting to Article and downcasting to WiredArticle.

> Question: How important is that downcasting? Should syndication instead operate on base types? The benefit would be that individual brands can add required fields for their own articles but present syndicated content in a more generic way. In a way, autopilot is really identifying that generic way of rendering content types for all brands.

Jason laid out the requirements for the inheritance model nicely.

Revisions only need to go in the forward direction, but they cannot change their super-type.

Revising a base type has to comply with Jason's requirements.
