# T05 Books
Endpoints: GET /books, GET /books/:id (see API.md). Author -> only own; admin -> all (optional ?authorId).
Response camelCase. Nullable fields stay null (in-production books). Foreign book id for an author -> 404.
Acceptance: Priya sees BK001, BK002 only; BK013/BK015 appear for their owners with null mrp; admin sees 18.
Commit: `feat(books): list and detail endpoints`.
