# Skill: security

Load for: any change touching auth, sessions, permissions, server actions, route handlers, data writes/deletes, identity checks, or anything a reviewer flags as a visibility/permission concern.

## Hard rules

1. **Identity comes from the server-side session only.** Never trust user-supplied IDs in DB lookups or writes; resolve identity from the session, then use that to scope the query.

2. **Permission audit rule.** When *any* reviewer (human or AI) flags a visibility / permission / auth concern, enumerate **every** permission path before dismissing it as theoretical:
   - `requireAdmin` gates
   - `system: true` bypasses
   - `hasFullAccess` flags
   - row-level grants (`allowedIds[]`, ACL rows)
   - role-flag derivations (`isLead`, `isMember`)
   - any code that *populates* permission state
   A finding being unsupported by the *one* path you checked is not the same as being unsupported. Walk all of them.

3. **Defensive defaults.** When in doubt, add the filter. The cost of an extra `$ne: null` or scope check is trivial; the cost of a leak is not.

4. **Acknowledge corrections explicitly** when you initially dismissed a finding and were wrong. Don't bury the reversal — name it.

5. **Never reason yourself out of a security finding.** If a path *could* leak under any reachable state, treat it as leaking until proven otherwise.

## What this project currently has

- Static tools, no auth, no server-side DB. Most of the surface is client-only computation + localStorage.
- **localStorage is not a trust boundary.** Stored data is user-owned and visible to any script on the same origin. Don't use it to remember anything sensitive.
- Any future server-side feature (analytics endpoints, API routes that take user input, sharing links with IDs) re-activates every rule above.

## Trigger checklist

Before merging a change that touches:

- [ ] A `route.js` / server action / API route — every input validated against a session, every output scoped to the caller.
- [ ] Anything that fetches by an ID from the request — the ID is verified against session-derived identity.
- [ ] A new permission flag — every existing path that grants access is enumerated and reasoned about, not just the new one.
- [ ] Third-party scripts / embeds — origin and CSP implications considered.
