# T05 Books

Files: routes/books.ts, controllers/bookController.ts, services/bookService.ts,
utils/mappers.ts (row -> API shape), routes/index.ts (register AFTER authenticate).

Endpoints (see API.md):

- GET /books author: own books only (WHERE author_id = req.user.authorId)
  admin: all books, optional ?authorId=AUTH001
- GET /books/:id author: 404 if book belongs to someone else (not 403: don't leak existence)
  admin: any

Response shape (camelCase, via mapper, never SELECT \* straight into res.json):
{ id, title, isbn, genre, publicationDate, status, mrp, copiesSold, royaltyPerCopy,
royaltyEarned, royaltyPaid, royaltyPending, lastPayoutDate, printPartner, availableOn[],
isInProduction }

- isInProduction = status starts with "In Production" (computed in mapper)
- Nullable fields stay null (BK013, BK015). Do NOT coerce to 0 or "".
- Admin response additionally includes authorId and authorName (JOIN authors).
- Validate :id and ?authorId with zod (non-empty string, max length).
- Authors with zero books return 200 with [] (not an error).
  Order: publication_date DESC NULLS LAST, then title.
  Acceptance: Priya -> BK001, BK002 only. Kavita -> BK015 (null mrp) + BK016. Sneha -> 3 books incl. BK013.
  Priya requesting /books/BK003 -> 404. Admin -> 18 books. Admin ?authorId=AUTH007 -> 3.
  Commit: feat(books): list and detail endpoints
