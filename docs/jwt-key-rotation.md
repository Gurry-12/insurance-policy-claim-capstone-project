# JWT Signing-Key Rotation

> Status: **planned guidance.** The current implementation signs with a single
> `app.security.jwt.secret` (`JWT_KEY` in `env.properties`). This document defines how to
> rotate the signing key safely and how the system would support it.

## Why rotation matters

A signing key that is compromised (secret leak, insider, long-lived single key) lets an
attacker forge tokens for any user. Periodic rotation limits the blast radius. Rotation
must be **non-disruptive**: tokens signed with the previous key must keep validating for
their remaining lifetime while new tokens are signed with the new key.

## Current state

- Single key: `JwtService` builds one `SecretKey` from `app.security.jwt.secret` and uses
  it for both signing and verification.
- Key is at least 256 bits (HS256) and lives only in the git-ignored `env.properties`.
- No kid header, no key registry.

## Recommended scheme (dual-key, `kid`-based)

1. **Introduce a key registry** with multiple active keys:

   ```yaml
   app.security.jwt.keys:
     - id: "2026-01"            # kid
       secret: ${JWT_KEY_CURRENT}
       is-current: true         # used for signing
     - id: "2025-06"            # previous key
       secret: ${JWT_KEY_PREVIOUS}
       is-current: false        # verify-only
   ```

2. **Sign** with the `is-current` key; put `kid` in the JWT header
   (`Jwts.builder().header().add("kid", keyId)`).

3. **Verify** by reading the `kid` header, resolving the matching key from the registry,
   and falling back to the current key if the `kid` is unknown (graceful downgrade until
   all old tokens age out).

4. `JwtService` retains a **time-based grace period**: keys marked verify-only continue
   validating until their tokens expire naturally.

## Rotation runbook

1. Generate a new 256-bit+ secret; add it as a new key with `is-current: true`.
2. Move the old key to `verify-only` (`is-current: false`). It keeps validating.
3. Wait at least the access-token TTL (15 min, or the max valid lifetime you accept).
4. Remove the old key and update `env.properties`; restart.
5. Verify with the audit log that no `TOKEN_INVALID` spike occurs after each step.

## Constraints this project must respect

- **`tokenVersion` stays the source of truth for revocation.** Key rotation only governs
  signature verification — it must never be used to revoke users (that is
  `tokenVersion`'s job).
- **HS256 requires symmetric keys.** Use at least 32 random bytes; prefer a KMS/secret
  manager over a property file in a real deployment. For asymmetric (RS256) rotation the
  same `kid` registry works with a JWKS endpoint.
- **Do not log key material.** `env.properties` stays git-ignored; secrets are injected
  via environment at deploy time (see `docs/deployment.md`).

## Testing rotation

- Unit: sign with key A, verify after registry switches to key B (`is-current`), and with
  key A still verify-only → passes; after A is removed → `TOKEN_INVALID`.
- Integration: reuse `JwtSecurityIntegrationTest`'s `tamperedTokenIsRejected` and
  `expiredTokenIsRejected` patterns against the key registry.
