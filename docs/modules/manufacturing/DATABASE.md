# Manufacturing Module — Database

No tables yet. Two things in this module are currently in-memory and
would need real persistence in production:

## Material profiles — currently a static array

`MATERIAL_PROFILES` in `packages/manufacturing-engine/src/material-profiles/materialProfiles.ts`
is a hardcoded array (3 acrylic thicknesses). Proposed schema:

```prisma
model MaterialProfile {
  id                  String @id
  name                String
  thicknessMm         Float
  kerfMm              Float
  cutSpeedMmPerMin    Int
  cutPowerPercent     Int
  engraveSpeedMmPerMin Int
  engravePowerPercent  Int

  @@map("material_profiles")
}
```

`getMaterialProfile`/`requireMaterialProfile` would switch from an
`Array.find` to a `db.materialProfile.findUnique` — the function
signatures wouldn't need to change, so callers (SVG generator, DXF
generator, nesting) are unaffected.

## Part number sequences — currently in-memory (`Map`)

`PartNumberSequencer` resets on every server restart. Proposed schema for
real persistence:

```prisma
model PartSequence {
  categoryCode String @id
  lastSequence Int    @default(0)

  @@map("part_sequences")
}
```

`next(categoryCode)` would become an atomic
`UPDATE part_sequences SET lastSequence = lastSequence + 1 WHERE categoryCode = ? RETURNING lastSequence`
(or Prisma's `update` with an atomic increment) instead of a `Map` read +
write — important once multiple server instances run concurrently, since
the current in-memory counter is per-process and would issue duplicate
numbers across instances.
