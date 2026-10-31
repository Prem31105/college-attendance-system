# Snapshot, Checkpoint & Recovery System

This directory stores structured metadata and backups for every checkpoint taken throughout development.

## Checkpoint Rules
1. Every checkpoint is identified by a unique ID (e.g. `checkpoint-001`, `checkpoint-002`).
2. Each checkpoint corresponds to a tagged Git commit (`refs/tags/checkpoint-XXX`).
3. Checkpoint metadata captures:
   - Checkpoint ID & Timestamp
   - Git Commit Hash & Current Branch
   - Completed features & Working state
   - Test results & Build status
   - Database migration state
   - Pending tasks & Next recommended actions
4. Checkpoints are logged chronologically in `checkpoint-log.md`.
5. Automatic rollback is supported via `scripts/rollback.ps1` or `scripts/rollback.sh`.
