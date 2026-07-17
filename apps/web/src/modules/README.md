# modules/

One folder per business feature (e.g. `design-studio/`, `marketing/`,
`finance/`). Each module owns its own components, hooks, and page logic,
and consumes the underlying `packages/*` engines rather than reimplementing
domain logic in the UI layer.
