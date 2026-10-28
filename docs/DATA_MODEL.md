# Data model (PostgreSQL)

```
users(id uuid pk, email unique, password_hash, role check in ('author','admin'), name, author_id fk->authors null, created_at)
authors(id text pk 'AUTH001', name, email, phone, city, joined_date)
books(id text pk 'BK001', author_id fk, title, isbn, genre, publication_date null, status, mrp int null,
      royalty_per_copy int null, copies_sold int default 0, royalty_earned int default 0, royalty_paid int default 0,
      royalty_pending int default 0, last_payout_date null, print_partner null, available_on text[] default '{}')
tickets(id uuid pk, author_id fk, book_id fk null, subject, description,
        status check in ('Open','In Progress','Resolved','Closed') default 'Open',
        category check in (6 categories) null, category_source check in ('ai','fallback','admin') null,
        priority check in ('Critical','High','Medium','Low') null, priority_source same enum,
        ai_status check in ('pending','done','failed') default 'pending', ai_reason text null,
        assigned_to fk->users null, created_at, updated_at, resolved_at null)
ticket_messages(id uuid pk, ticket_id fk, sender_role ('author','admin'), sender_id fk->users, body, created_at)
internal_notes(id uuid pk, ticket_id fk, admin_id fk->users, body, created_at)   -- NEVER returned to authors
ai_drafts(id uuid pk, ticket_id fk, draft_text, model, prompt_tokens, completion_tokens, latency_ms, created_at)
ai_usage_log(id, ticket_id null, task ('triage'|'draft'), model, prompt_tokens, completion_tokens, latency_ms, success bool, error text null, created_at)
```
Indexes: tickets(author_id), tickets(status, priority, created_at), ticket_messages(ticket_id, created_at).

## Dataset edge cases (must be handled; AI drafts must respect them)
| Case | Books | Handling |
|---|---|---|
| In production, no MRP/royalty/pub date | BK013 (Cover Design), BK015 (Typesetting) | Show status, "—" for nulls, no royalty claims by AI. Production-stage KB applies |
| Zero payout ever, pending >= 1000 | BK005 (2546), BK010 (2464), BK018 (1575) | Candidate for "genuinely overdue" escalation |
| Zero payout, pending < 1000 | BK016 (850) | Below Rs 1,000 threshold -> rolls over, explain it |
| Fully paid, pending 0 | BK002, BK007, BK008, BK014 | Don't claim anything is owed |
| Partial paid | BK001, BK003, BK004, BK006, BK009, BK011, BK012, BK017 | Quote real paid/pending/last payout date |
Data check: royalty_earned == royalty_per_copy * copies_sold for every published book; pending == earned - paid.
Names contain non-ASCII (e.g. "Durga’s Daughters"): keep UTF-8 everywhere.
Seed users: one per author (email from JSON, password `Password@123`), plus `admin@bookleaf.com` and `admin2@bookleaf.com`.
