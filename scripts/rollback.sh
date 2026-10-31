#!/usr/bin/env bash
# ==============================================================================
# Autonomous Rollback Script (Bash)
# Usage: ./scripts/rollback.sh [checkpoint-001]
# ==============================================================================
set -euo pipefail

TARGET_CHECKPOINT="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

if [ -z "$TARGET_CHECKPOINT" ]; then
    echo "=== AVAILABLE CHECKPOINTS ==="
    grep "checkpoint-" "$REPO_ROOT/snapshots/checkpoint-log.md" || echo "No checkpoints logged."
    echo ""
    echo "Usage: ./scripts/rollback.sh checkpoint-001"
    exit 0
fi

echo ">>> [ROLLBACK] Initiating rollback to $TARGET_CHECKPOINT..."

if ! git rev-parse "$TARGET_CHECKPOINT" >/dev/null 2>&1; then
    echo "ERROR: Target checkpoint '$TARGET_CHECKPOINT' does not exist."
    exit 1
fi

# Safety check for uncommitted files
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    echo ">>> Uncommitted changes detected. Creating safety commit..."
    SAFETY_TAG="safety-backup-$(date -u +'%Y%m%d-%H%M%S')"
    git add -A
    git commit -m "[SAFETY-BACKUP] Auto-backup before rollback to $TARGET_CHECKPOINT" || true
    git tag "$SAFETY_TAG"
    echo ">>> Preserved uncommitted changes under tag: $SAFETY_TAG"
fi

git checkout "$TARGET_CHECKPOINT"
CURRENT_COMMIT=$(git rev-parse HEAD)
echo ">>> [ROLLBACK COMPLETE] Successfully restored system to $TARGET_CHECKPOINT ($CURRENT_COMMIT)."
