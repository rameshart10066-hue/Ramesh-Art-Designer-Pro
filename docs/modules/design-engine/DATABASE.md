# Design Generator Module — Database

No tables. This module is entirely stateless: every generator is a pure
function of its input parameters, and no generated design is persisted.

## Future consideration (not built)

If designs need to be saved (e.g. "my saved nameplate designs"), a
`SavedDesign` table would store the *request* (the discriminated
`DesignGeneratorRequest` JSON) rather than the rendered SVG — regenerating
from the request on load keeps a single source of truth and lets a future
change to a generator (e.g. a bug fix in finger-joint geometry) improve
previously-saved designs automatically instead of leaving stale SVG
snapshots around.
