# Documentation Archive

This directory contains historical analysis and design decision documents that were created during the development of Ledgerly. These documents are preserved for reference but are no longer actively maintained.

## Contents

### DATABASE_TRANSACTION_ENTRIES_ANALYSIS.md
Analysis of the database design for Transaction-Entry relationships. Discusses the pros and cons of normalized vs denormalized approaches and justifies the chosen normalized model.

**Key Decision**: Use normalized model with foreign keys instead of storing direct references.

### DDD_TRANSACTION_ENTRIES_ANALYSIS.md
Domain-Driven Design analysis of whether Transaction should contain direct references to its Entries or treat them as separate aggregates.

**Key Decision**: Transaction as Aggregate Root containing Entries to ensure business invariants (balanced transactions).

### DOMAIN_VS_DATABASE_COMPARISON.md
Comparison between the in-memory domain model and persistent database schema, explaining how they differ and why this separation is beneficial.

**Key Insight**: Domain model focuses on business behavior, database schema focuses on storage optimization and normalization.

## Note

For current domain documentation, see:
- `/docs/DOMAIN.md` - Current domain model and business rules
- `/docs/DATABASE_SCHEMA.md` - Current database schema
- `/apps/backend/src/domain/domain-core/README.md` - DDD implementation details
