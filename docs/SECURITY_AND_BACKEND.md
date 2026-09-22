# Marea production architecture

The repository uses Supabase Auth, Postgres Row Level Security and Storage policies as its application backend. The initial schema and authorization rules live in `supabase/migrations`. The controls below describe both the implemented database boundary and the account-level controls that must be configured before accepting production data.

## Authentication and authorization

- Use email verification plus OAuth, passkeys or TOTP MFA for privileged accounts.
- Supabase manages and refreshes browser sessions. Review the chosen Supabase Auth storage model and session lifetime against the production threat model.
- Keep admin sessions shorter than standard user sessions and require recent re-authentication for critical changes.
- Resolve the authenticated account and its restrictions for every request.
- Enforce role and permission checks in Postgres RLS and privileged database functions. Hiding navigation is never authorization.
- Return `401` for unauthenticated access and `403` for authenticated accounts without permission.
- Use least-privilege roles such as `owner`, `admin`, `moderator`, `course_reviewer` and `member`.

Example server-side decision order:

1. Validate the session.
2. Reject suspended or restricted accounts.
3. Confirm the role can access the resource.
4. Confirm the specific permission allows the action.
5. Confirm ownership or an explicit collaboration grant for user-owned content.
6. Record privileged mutations in an append-only audit log.

## Content visibility

- `private`: owner and explicitly invited collaborators only.
- `unlisted`: accessible by an unguessable link but excluded from feeds, indexes and search.
- `public`: eligible for profiles, feeds and search.
- `showcase`: public content with an additional project presentation layer.
- Search and feed queries must filter by visibility at the database query level, not after records are returned.
- Media should use private object storage and short-lived signed URLs where access is restricted.

## Implemented domain model

- Supabase `auth.users`, profiles and platform roles
- follows, friendships and notifications
- posts, comments and reactions
- worlds, world members, characters, locations, factions, items and world events
- projects and project members
- courses and lessons
- reports, site settings and audit logs

User-owned entities include an owner/user reference, visibility where applicable and timestamps. Public queries only return explicitly published public/showcase records. Additional version history and a dedicated showcase projection are recommended before collaborative editing becomes generally available.

## Admin controls

- Admin is served from a separately protected route group and all privileged mutations are checked again in database RPCs.
- Require MFA/passkey enrollment for privileged roles.
- Add rate limits, IP/device anomaly alerts and step-up authentication for destructive or brand-wide changes.
- Platform-theme changes are allowlisted and audited. Add a version/rollback table before delegating appearance access beyond trusted administrators.
- Record actor, action, target, before/after summary, timestamp and request identifier for every privileged mutation.
- Encrypt backups, test restores and separate backup credentials from application credentials.

## AI boundary

AI output should be stored as a suggestion with provenance. It must never silently overwrite canon, publish content, change visibility or train on private creative work without explicit consent.
