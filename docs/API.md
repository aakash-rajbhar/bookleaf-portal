# BookLeaf Author Support Portal — REST API Reference

The BookLeaf REST API is mounted at `/api/v1`. All endpoints return JSON and use standard HTTP response codes.

---

## 1. Authentication & Security

### Bearer Token Authentication
All protected routes require an `Authorization` header containing a valid JSON Web Token (JWT) issued by `POST /api/v1/auth/login`:
```http
Authorization: Bearer <jwt-token>
```
Tokens are signed using `HS256` and encode `{ sub: string, email: string, role: 'author' | 'admin', authorId: string | null }`.

### SSE Stream Token Flow
Web browser `EventSource` interfaces cannot send custom `Authorization` HTTP headers. To prevent exposing long-lived login tokens in URLs or browser history:
1. Client makes an authenticated `POST /api/v1/events/token` request using its Bearer token.
2. Server returns a short-lived (60-second), single-purpose JWT with `{ purpose: 'sse' }`.
3. Client opens the event stream at `GET /api/v1/events?token=<streamToken>`.
4. Regular API endpoints reject stream tokens, and `GET /api/v1/events` rejects standard login tokens.

---

## 2. Standard Error Response Shape

Every error response follows a uniform schema:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "path": "subject",
        "message": "Subject must be at least 3 characters"
      }
    ]
  }
}
```

### Standard Error Codes
| HTTP Status | Error Code | Description |
| :--- | :--- | :--- |
| `400` | `VALIDATION_ERROR` | Request body, query parameters, or URL params failed Zod schema validation. |
| `400` | `BAD_REQUEST` | Malformed request or semantic client error. |
| `401` | `UNAUTHORIZED` | Missing, invalid, expired, or wrong-purpose JWT. |
| `403` | `FORBIDDEN` | Authenticated user lacks required role or permission for this resource. |
| `404` | `NOT_FOUND` | Route or resource does not exist (or belongs to another author). |
| `409` | `CONFLICT` | Request conflicts with current database state. |
| `500` | `INTERNAL_ERROR` | Unexpected server error. In production, raw details are suppressed. |

---

## 3. Public Endpoints

### `GET /api/v1/health`
Health check endpoint reporting API and database connectivity.

- **Role**: Public (No auth required)
- **Response**: `200 OK` (or `503 Service Unavailable` if database is down)
  ```json
  {
    "status": "ok",
    "db": "ok",
    "time": "2026-10-29T06:00:00.000Z"
  }
  ```

---

## 4. Authentication Endpoints

### `POST /api/v1/auth/login`
Authenticates an author or administrator using email and password.

- **Role**: Public (No auth required)
- **Request Body**:
  ```json
  {
    "email": "priya.sharma@email.com",
    "password": "Password@123"
  }
  ```
  *Validation Rules*:
  - `email`: string, valid email format, trimmed.
  - `password`: string, min 1 character.
- **Success Response**: `200 OK`
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "u0000000-0000-4000-a000-000000000001",
      "email": "priya.sharma@email.com",
      "name": "Priya Sharma",
      "role": "author",
      "authorId": "AUTH001"
    }
  }
  ```
- **Error Codes**: `400 VALIDATION_ERROR`, `401 UNAUTHORIZED` (Invalid credentials)

---

### `GET /api/v1/auth/me`
Retrieves the profile of the currently authenticated user.

- **Role**: Authenticated (`author` or `admin`)
- **Headers**: `Authorization: Bearer <token>`
- **Success Response**: `200 OK`
  ```json
  {
    "user": {
      "id": "u0000000-0000-4000-a000-000000000001",
      "email": "priya.sharma@email.com",
      "name": "Priya Sharma",
      "role": "author",
      "authorId": "AUTH001"
    }
  }
  ```
- **Error Codes**: `401 UNAUTHORIZED`, `404 NOT_FOUND`

---

## 5. Real-Time Events (SSE)

### `POST /api/v1/events/token`
Generates a short-lived (60s) single-purpose stream token for Server-Sent Events.

- **Role**: Authenticated (`author` or `admin`)
- **Headers**: `Authorization: Bearer <token>`
- **Success Response**: `200 OK`
  ```json
  {
    "streamToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresInSeconds": 60
  }
  ```
- **Error Codes**: `401 UNAUTHORIZED`

---

### `GET /api/v1/events`
Establishes a persistent Server-Sent Events stream connection.

- **Role**: Authenticated via Query Parameter
- **Query Parameters**:
  - `token`: Required string (short-lived stream token obtained from `POST /events/token`)
- **Response**: `text/event-stream`
  - Sends initial event: `event: ready\ndata: {}\n\n`
  - Sends periodic heartbeats: `: ping\n\n` every 25 seconds
  - Broadcasts domain events:
    - `ticket.created`: Emitted when an author submits a new ticket.
    - `ticket.triaged`: Emitted when background AI triage completes or falls back.
    - `ticket.reply`: Emitted when an admin posts a message.
- **Error Codes**: `401 UNAUTHORIZED` (Missing or invalid stream token)

---

## 6. Books Endpoints

### `GET /api/v1/books`
Lists books. Authors see only their own published and in-production titles. Admins see all books or filter by `authorId`.

- **Role**: Authenticated (`author` or `admin`)
- **Query Parameters**:
  - `authorId`: optional string, min 1, max 50 characters (Admins only; ignored for authors).
- **Success Response**: `200 OK`
  ```json
  [
    {
      "id": "BK001",
      "title": "Whispers of the Ganges",
      "isbn": "978-93-5XXXX-01-1",
      "genre": "Literary Fiction",
      "publicationDate": "2023-06-20",
      "status": "Published & Live",
      "mrp": 399,
      "copiesSold": 342,
      "royaltyPerCopy": 35,
      "royaltyEarned": 11970,
      "royaltyPaid": 8400,
      "royaltyPending": 3570,
      "lastPayoutDate": "2025-10-15",
      "printPartner": "In-House",
      "availableOn": ["Amazon India", "Flipkart", "BookLeaf Store"],
      "isInProduction": false
    }
  ]
  ```
- **Error Codes**: `401 UNAUTHORIZED`

---

### `GET /api/v1/books/:id`
Retrieves complete details for a single book.

- **Role**: Authenticated (`author` or `admin`)
- **Path Parameters**:
  - `id`: string, min 1, max 50 characters.
- **Ownership Enforcement**: If an author requests a book belonging to another author, the API returns `404 NOT_FOUND` to prevent ID enumeration.
- **Success Response**: `200 OK` (returns single Book object as shown above).
- **Error Codes**: `401 UNAUTHORIZED`, `404 NOT_FOUND`

---

## 7. Author Ticket Endpoints

### `POST /api/v1/tickets`
Submits a new author support ticket. Asynchronously enqueues the ticket for background AI triage.

- **Role**: Author (`author` role only)
- **Request Body**:
  ```json
  {
    "bookId": "BK001",
    "subject": "ISBN mismatch on Amazon listing",
    "description": "The paperback ISBN displayed on Amazon does not match the copyright page."
  }
  ```
  *Validation Rules*:
  - `bookId`: optional string, nullable, min 1 character. If provided, must belong to the authenticated author.
  - `subject`: string, trimmed, min 3, max 150 characters.
  - `description`: string, trimmed, min 10, max 5000 characters.
- **Success Response**: `201 Created`
  ```json
  {
    "id": "d0000000-0000-4000-a000-000000000002",
    "subject": "ISBN mismatch on Amazon listing",
    "description": "The paperback ISBN displayed on Amazon does not match the copyright page.",
    "status": "Open",
    "bookId": "BK001",
    "createdAt": "2026-10-29T06:00:00.000Z",
    "updatedAt": "2026-10-29T06:00:00.000Z"
  }
  ```
  *(Note: Internal triage metadata like category, priority, and AI confidence are strictly omitted from author responses.)*
- **Error Codes**: `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `403 FORBIDDEN` (Admins cannot call author ticket creation), `404 NOT_FOUND` (Invalid book ID).

---

### `GET /api/v1/tickets`
Lists all support tickets submitted by the authenticated author.

- **Role**: Author (`author` role only)
- **Query Parameters**:
  - `limit`: optional integer, min 1, max 100, default `50`.
  - `offset`: optional integer, min 0, default `0`.
- **Success Response**: `200 OK`
  ```json
  {
    "items": [
      {
        "id": "d0000000-0000-4000-a000-000000000002",
        "subject": "ISBN mismatch on Amazon listing",
        "description": "The paperback ISBN displayed on Amazon does not match...",
        "status": "Open",
        "bookId": "BK001",
        "bookTitle": "Whispers of the Ganges",
        "createdAt": "2026-10-29T06:00:00.000Z",
        "updatedAt": "2026-10-29T06:00:00.000Z",
        "messages": []
      }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0
  }
  ```
- **Error Codes**: `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `403 FORBIDDEN`

---

### `GET /api/v1/tickets/:id`
Retrieves a single ticket submitted by the authenticated author, including public message replies.

- **Role**: Author (`author` role only)
- **Path Parameters**:
  - `id`: string, UUID or ID, min 1, max 50 characters.
- **Ownership Enforcement**: Returns `404 NOT_FOUND` if the ticket belongs to another author.
- **Success Response**: `200 OK`
  ```json
  {
    "id": "d0000000-0000-4000-a000-000000000002",
    "subject": "ISBN mismatch on Amazon listing",
    "description": "The paperback ISBN displayed on Amazon does not match...",
    "status": "Open",
    "bookId": "BK001",
    "bookTitle": "Whispers of the Ganges",
    "createdAt": "2026-10-29T06:00:00.000Z",
    "updatedAt": "2026-10-29T06:00:00.000Z",
    "messages": [
      {
        "id": "m0000000-0000-4000-b000-000000000001",
        "senderRole": "admin",
        "body": "Hello Priya, we have escalated this to our catalog team.",
        "createdAt": "2026-10-29T06:30:00.000Z"
      }
    ]
  }
  ```
- **Error Codes**: `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND`

---

## 8. Admin Ticket Endpoints

All routes under `/api/v1/admin` require the `admin` role (`403 FORBIDDEN` if called by an author).

### `GET /api/v1/admin/tickets`
Lists all author tickets across the system with filtering, searching, and urgency sorting.

- **Role**: Administrator (`admin` only)
- **Query Parameters**:
  - `status`: optional enum (`Open`, `In Progress`, `Resolved`, `Closed`).
  - `category`: optional enum (`Royalty & Payments`, `ISBN & Metadata Issues`, `Printing & Quality`, `Distribution & Availability`, `Book Status & Production Updates`, `General Inquiry`).
  - `priority`: optional enum (`Critical`, `High`, `Medium`, `Low`).
  - `from`: optional ISO datetime or `YYYY-MM-DD` date string.
  - `to`: optional ISO datetime or `YYYY-MM-DD` date string.
  - `assignedTo`: optional string (`me`, `unassigned`, or a specific admin user UUID).
  - `q`: optional search string (searches subject, description, author name, book title).
  - `sort`: optional enum (`urgency`, `newest`, `oldest`), default `urgency`.
  - `limit`: optional integer, min 1, max 100, default `25`.
  - `offset`: optional integer, min 0, default `0`.
- **Success Response**: `200 OK`
  ```json
  {
    "items": [
      {
        "id": "d0000000-0000-4000-a000-000000000001",
        "subject": "Royalty payment not received for Between Two Temples",
        "status": "Open",
        "category": "Royalty & Payments",
        "categorySource": "ai",
        "priority": "High",
        "prioritySource": "ai",
        "aiStatus": "done",
        "authorId": "AUTH003",
        "authorName": "Ananya Reddy",
        "bookId": "BK005",
        "bookTitle": "Between Two Temples",
        "assignedTo": null,
        "createdAt": "2026-10-17T06:00:00.000Z",
        "updatedAt": "2026-10-17T06:00:00.000Z",
        "ageHours": 288,
        "isOverdue": true
      }
    ],
    "total": 7,
    "limit": 25,
    "offset": 0
  }
  ```
- **Error Codes**: `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `403 FORBIDDEN`

---

### `GET /api/v1/admin/tickets/:id`
Retrieves complete admin context for a ticket, including author metadata, book financial facts, message thread, internal notes, and cached AI drafts.

- **Role**: Administrator (`admin` only)
- **Path Parameters**:
  - `id`: string, min 1, max 50 characters.
- **Success Response**: `200 OK`
  ```json
  {
    "id": "d0000000-0000-4000-a000-000000000001",
    "subject": "Royalty payment not received for Between Two Temples",
    "description": "Hi, I noticed my pending royalty of Rs 2,546 has not been paid out yet...",
    "status": "Open",
    "category": "Royalty & Payments",
    "categorySource": "ai",
    "priority": "High",
    "prioritySource": "ai",
    "aiStatus": "done",
    "aiReason": "Author inquiry regarding pending royalty payment status and payout timeline.",
    "authorId": "AUTH003",
    "authorName": "Ananya Reddy",
    "bookId": "BK005",
    "bookTitle": "Between Two Temples",
    "assignedTo": null,
    "createdAt": "2026-10-17T06:00:00.000Z",
    "updatedAt": "2026-10-17T06:00:00.000Z",
    "resolvedAt": null,
    "ageHours": 288,
    "isOverdue": true,
    "author": {
      "id": "AUTH003",
      "name": "Ananya Reddy",
      "email": "ananya.reddy@email.com",
      "city": "Hyderabad"
    },
    "book": {
      "id": "BK005",
      "title": "Between Two Temples",
      "isbn": "978-93-5XXXX-05-9",
      "genre": "Historical Fiction",
      "status": "Published & Live",
      "mrp": 350,
      "copiesSold": 91,
      "royaltyPerCopy": 28,
      "royaltyEarned": 2548,
      "royaltyPaid": 0,
      "royaltyPending": 2548,
      "lastPayoutDate": null,
      "isInProduction": false
    },
    "messages": [],
    "internalNotes": [
      {
        "id": "n0000000-0000-4000-c000-000000000001",
        "adminId": "u0000000-0000-4000-a000-000000000099",
        "adminName": "BookLeaf Admin",
        "body": "Checking with the finance team regarding Ananya's pending transfer schedule.",
        "createdAt": "2026-10-18T08:00:00.000Z"
      }
    ],
    "latestDraft": null
  }
  ```
- **Error Codes**: `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND`

---

### `PATCH /api/v1/admin/tickets/:id`
Updates ticket status, category, priority, or staff assignment. Any manual change to category or priority automatically flags the field's source as `admin` to prevent background AI overwrite.

- **Role**: Administrator (`admin` only)
- **Path Parameters**:
  - `id`: string, min 1, max 50 characters.
- **Request Body**:
  ```json
  {
    "status": "In Progress",
    "category": "Royalty & Payments",
    "priority": "Critical",
    "assignedTo": "me"
  }
  ```
  *Validation Rules*:
  - At least one field must be provided.
  - `status`: optional enum (`Open`, `In Progress`, `Resolved`, `Closed`). Setting `Resolved` or `Closed` sets `resolved_at = NOW()`.
  - `category`: optional enum (`Royalty & Payments`, `ISBN & Metadata Issues`, `Printing & Quality`, `Distribution & Availability`, `Book Status & Production Updates`, `General Inquiry`).
  - `priority`: optional enum (`Critical`, `High`, `Medium`, `Low`).
  - `assignedTo`: optional union (`'me'`, UUID string, or `null` to unassign).
- **Success Response**: `200 OK`
  ```json
  {
    "id": "d0000000-0000-4000-a000-000000000001",
    "status": "In Progress",
    "category": "Royalty & Payments",
    "priority": "Critical",
    "assignedTo": {
      "id": "u0000000-0000-4000-a000-000000000099",
      "name": "BookLeaf Admin"
    },
    "updatedAt": "2026-10-29T06:15:00.000Z",
    "resolvedAt": null
  }
  ```
- **Error Codes**: `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND`

---

### `POST /api/v1/admin/tickets/:id/reply`
Posts an official support response to the author. Appends the message to the conversation thread, optionally marks the ticket resolved, and broadcasts a `ticket.reply` event via SSE.

- **Role**: Administrator (`admin` only)
- **Path Parameters**:
  - `id`: string, min 1, max 50 characters.
- **Request Body**:
  ```json
  {
    "body": "Hello Ananya, our finance team has verified your bank account and initiated the Rs 2,546 transfer.",
    "markResolved": true
  }
  ```
  *Validation Rules*:
  - `body`: string, trimmed, min 1, max 5000 characters.
  - `markResolved`: optional boolean.
- **Success Response**: `200 OK`
  ```json
  {
    "id": "m0000000-0000-4000-b000-000000000002",
    "ticketId": "d0000000-0000-4000-a000-000000000001",
    "senderRole": "admin",
    "senderId": "u0000000-0000-4000-a000-000000000099",
    "body": "Hello Ananya, our finance team has verified your bank account and initiated the Rs 2,546 transfer.",
    "createdAt": "2026-10-29T06:20:00.000Z"
  }
  ```
- **Error Codes**: `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND`

---

### `POST /api/v1/admin/tickets/:id/notes`
Adds an internal staff note to a ticket. Internal notes are **strictly isolated** from author views.

- **Role**: Administrator (`admin` only)
- **Path Parameters**:
  - `id`: string, min 1, max 50 characters.
- **Request Body**:
  ```json
  {
    "body": "Spoke with finance lead; batch payment scheduled for Friday."
  }
  ```
  *Validation Rules*:
  - `body`: string, trimmed, min 1, max 2000 characters.
- **Success Response**: `201 Created`
  ```json
  {
    "id": "n0000000-0000-4000-c000-000000000002",
    "ticketId": "d0000000-0000-4000-a000-000000000001",
    "adminId": "u0000000-0000-4000-a000-000000000099",
    "adminName": "BookLeaf Admin",
    "body": "Spoke with finance lead; batch payment scheduled for Friday.",
    "createdAt": "2026-10-29T06:22:00.000Z"
  }
  ```
- **Error Codes**: `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND`

---

### `POST /api/v1/admin/tickets/:id/triage`
Manually re-triggers AI triage for a ticket (used as the "Retry" button when `ai_status = 'failed'`). Resets status to `pending` and pushes the ticket to the triage queue.

- **Role**: Administrator (`admin` only)
- **Path Parameters**:
  - `id`: string, min 1, max 50 characters.
- **Success Response**: `202 Accepted`
  ```json
  {
    "message": "Triage queued",
    "ticketId": "d0000000-0000-4000-a000-000000000001"
  }
  ```
- **Error Codes**: `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND`

---

### `POST /api/v1/admin/tickets/:id/draft`
Generates an AI-drafted reply based strictly on the ticket query, author facts, and category knowledge base. Results are cached in `ai_drafts` to conserve LLM quota. If the AI provider is unavailable, generates a deterministic template draft.

- **Role**: Administrator (`admin` only)
- **Path Parameters**:
  - `id`: string, min 1, max 50 characters.
- **Request Body**:
  ```json
  {
    "regenerate": false
  }
  ```
  *Validation Rules*:
  - `regenerate`: optional boolean. When `false` (default), returns existing cached draft if present. When `true`, forces fresh generation.
- **Success Response**: `200 OK`
  ```json
  {
    "text": "Hello Ananya,\n\nThank you for reaching out to BookLeaf Support. I understand your concern regarding the pending royalty payment of Rs 2,546 for \"Between Two Temples\"...\n\nWarm regards,\nBookLeaf Support Team",
    "source": "ai",
    "model": "gemini-3.5-flash-lite",
    "createdAt": "2026-10-29T06:25:00.000Z",
    "cached": false
  }
  ```
- **Error Codes**: `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND`
