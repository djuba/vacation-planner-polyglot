# api-go (future)

Go backend. Not started; this directory holds only this README until the work is requested. No placeholder implementation belongs here.

## Contract it must satisfy

- Serve the HTTP API v1 described in `CLAUDE.md` §5 (`/v1/trip/extract`, `/v1/trip/recommend`, `/v1/trip/present`, `/v1/health`) with `backend: 'go'` in the health response.
- Generate its models from `packages/domain-schema/generated/` (JSON Schema, `openapi.yaml`, `constants.json`), never from the TypeScript sources.
- Implement the invariant rules in `packages/domain-schema/rules.md`.
- Run with `LLM_MODE=replay` and pass both contract halves against `API_BASE_URL`: the Pact verification (`tests/contract/pact-verify.test.ts`) and the schema-first conformance suite (`tests/contract/conformance/**`). See `CLAUDE.md` §6.5.
