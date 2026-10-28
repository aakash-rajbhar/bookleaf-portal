# T12b Author books + submit query

Files: src/pages/author/Books.tsx, src/pages/author/SubmitQuery.tsx, src/components/{BookCard,StatusBadge}.tsx, src/lib/format.ts.
Books page (GET /books): cards or a table with title, ISBN, genre, publication date, status badge, MRP, copies sold,
royalty earned / paid / pending, last payout date, print partner, available-on platforms.

- Format money as Indian rupees (Intl.NumberFormat 'en-IN'). Null values show an em dash, never 0 or "null".
- In-production books (isInProduction): show a "In production: <stage>" banner and hide the royalty block entirely.
- Pending royalty > 0 and never paid: gentle note ("No payout yet. Royalties are paid quarterly").
- Empty state if the author has no books. Loading and error states with retry.
  Submit Query (POST /tickets): book dropdown ("General / Account Level" first, then the author's books, bookId omitted for General),
  subject (3-150, counter), description (10-5000, counter), optional file input that only shows chosen file names with the note
  "Attachments are not uploaded in this demo". Client-side validation mirroring the zod limits, but always display server
  validation errors from details[]. Submitting disables the button; success -> navigate to /tickets/<id> with a success message.
  Acceptance: Kavita sees BK015 as in production with no royalty block; Ananya sees pending 2,546 and the no-payout note;
  Priya can submit a General ticket and a ticket for BK001; a 2-character subject shows an error.
  Commit: feat(frontend): author books page and support query form
