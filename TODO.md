# Booktribe — Outstanding Tasks

## Before Go-Live

- [ ] **Clerk Webhook** — register `/api/webhooks/clerk` in the Clerk Dashboard once the production URL is known.
  Set `CLERK_WEBHOOK_SIGNING_SECRET` in `.env.local` (and production env).
  Handles: `user.created`, `user.updated`, `user.deleted` → syncs to `users` table.
  File: `src/app/api/webhooks/clerk/route.ts`

- [ ] **Replace mock data** — `explore/page.tsx` and `library/page.tsx` currently use hardcoded arrays.
  Wire them up to real `books`, `communities`, and `swap_requests` DB queries.

- [ ] **Add book form → DB** — `AddBookButton.tsx` currently fakes a save with a timeout.
  Connect to a Server Action that inserts into the `books` table.

- [ ] **Swap request form → DB** — `swap/[bookId]/page.tsx` fakes submission.
  Connect to a Server Action that inserts into `swap_requests`.

- [ ] **Community join → DB** — "Join" buttons on explore and home pages are not yet wired up.
  Connect to a Server Action that inserts into `community_members`.

- [ ] **Production Neon branch** — create a separate production database branch in Neon
  and set `DATABASE_URL` in the production environment.

## Nice to Have

- [ ] **Book cover images** — integrate Google Books API or Open Library to auto-fetch cover art.
- [ ] **Email notifications** — use Clerk's email templates or Resend to notify users of swap request updates.
- [ ] **Reviews** — add a `reviews` table and post-swap rating flow.
- [ ] **Mobile nav** — hamburger menu for the navbar on small screens.
