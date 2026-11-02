# Resume Project Prompt for AI Coding Agents

> **Instructions for the Incoming AI Coding Agent:**
> 
> First inspect `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `DEVELOPMENT_PROGRESS.md`, Git status, the current branch, the latest checkpoint and the existing project files.
> 
> Do not recreate the project from scratch.
> 
> Do not overwrite completed work.
> 
> Identify the last stable checkpoint and the latest in-progress changes.
> 
> Run appropriate tests to determine the current state.
> 
> Continue from the exact next task recorded in `AGENT_HANDOFF.md`.
> 
> If the current changes are broken, inspect the errors and recover from the latest stable checkpoint when appropriate.
> 
> Preserve all existing work and update the handoff files before stopping.

---

## Quick Reference Commands

### Checkpoint Operations
- **Save Checkpoint**:
  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts/checkpoint.ps1 -Description "Your checkpoint description"
  ```
- **List Checkpoints**:
  ```powershell
  Get-Content snapshots/checkpoint-log.md
  ```
- **Rollback to Checkpoint**:
  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts/rollback.ps1 -CheckpointId "checkpoint-XXX"
  ```

### Running the Services
- **Backend API**:
  ```bash
  cd backend && npm run start:dev
  ```
- **Web Dashboard**:
  ```bash
  cd web_dashboard && npm run dev
  ```
- **Backend Tests**:
  ```bash
  cd backend && npm test
  ```
- **Backend E2E Suite**:
  ```bash
  cd backend && npx ts-node scripts/verify-e2e-workflow.ts
  ```
- **Flutter Tests & Analyze**:
  ```powershell
  $env:TEMP="D:\tmp"; $env:TMP="D:\tmp"; cd student_mobile && flutter test && flutter analyze
  ```
- **Phase 2.3 Independent Audit Suite**:
  ```powershell
  cd backend && npx ts-node scripts/audit-phase23.ts
  ```
