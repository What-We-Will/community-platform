# Database tests

Run pgTAP tests against the disposable local Docker stack with:

```bash
supabase test db --local
```

Every future migration that adds or changes an RLS policy must ship a corresponding pgTAP test in
this directory, as required by `TESTING_STANDARDS.security-rls.md`.
