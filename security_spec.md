# Security Specification - DFW Monev & Project Hub

## Invariants
1. A vessel document must have a valid ID string (max 128 chars), a non-empty name, registration number, and risk level.
2. An inspection document must reference an existing vessel ID and contain valid positive counts for crew and violations.
3. Timestamps must be valid and strings must respect defined length constraints to avoid wallet exhaustion.

## Operations
- `vessels`: Read allowed for authenticated users. Create/Update allowed for authenticated inspectors with verified schema.
- `inspections`: Read allowed for authenticated users. Create allowed for authenticated inspectors with matching creator ID.
