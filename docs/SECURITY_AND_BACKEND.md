# Marea production architecture

The current repository is an interactive frontend prototype. The following controls must be implemented in the production API before real user data is accepted.

## Authentication and authorization

- Use email verification plus OAuth, passkeys or TOTP MFA for privileged accounts.
- Store sessions in secure, HTTP-only, same-site cookies. Rotate sessions after authentication and privilege changes.
- Keep admin sessions shorter than standard user sessions and require recent re-authentication for critical changes.
- Resolve the authenticated account and its restrictions for every request.
- Enforce role and permission checks in server middleware and service methods. Hiding navigation is never authorization.
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

## Suggested domain model

- accounts, profiles, sessions, roles, permissions
- follows, friendships, notifications, conversations
- posts, post_media, comments, reactions, saves
- worlds, world_members, characters, locations, factions, items, events, timelines, relations, notes
- projects, project_members, project_needs, project_assets
- courses, chapters, lessons, exercises, course_reviews
- reports, moderation_actions, audit_events, appearance_versions

Every user-owned entity should include `owner_id`, `visibility`, timestamps and a version field. Public publishing should copy only explicitly selected material into a showcase projection so private notes cannot leak through nested API responses.

## Admin controls

- Serve Admin from a separately protected route group or origin.
- Require MFA/passkey enrollment for privileged roles.
- Add rate limits, IP/device anomaly alerts and step-up authentication for destructive or brand-wide changes.
- Make platform-theme changes versioned and reversible.
- Record actor, action, target, before/after summary, timestamp and request identifier for every privileged mutation.
- Encrypt backups, test restores and separate backup credentials from application credentials.

## AI boundary

AI output should be stored as a suggestion with provenance. It must never silently overwrite canon, publish content, change visibility or train on private creative work without explicit consent.
