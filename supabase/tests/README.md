# Database tests

Run pgTAP tests against the disposable local Docker stack with:

```bash
npx --no-install supabase test db --local
```

Every future migration that adds or changes an RLS policy must ship a corresponding pgTAP test in
this directory, as required by `TESTING_STANDARDS.security-rls.md`.

Tests must establish any identities they need within their transaction; this repository does not
install an external `tests`-schema helper package.
