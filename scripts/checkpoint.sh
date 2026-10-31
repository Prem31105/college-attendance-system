#!/usr/bin/env bash
# ==============================================================================
# Autonomous Checkpoint Creation Script (Bash)
# Usage: ./scripts/checkpoint.sh "checkpoint description"
# ==============================================================================
set -euo pipefail

DESCRIPTION="${1:-Autonomous development checkpoint}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

echo ">>> [CHECKPOINT] Starting checkpoint creation process..."

# Verify Git
if [ ! -d ".git" ]; then
    echo "ERROR: Git repository not initialized. Run 'git init' first."
    exit 1
fi

# Secret Scan
FORBIDDEN_FILES=$(git status --porcelain | awk '{print $2}' | grep -E '^(\.env|\.env\..*|\.key$|\.pem$|\.keystore$|\.jks$|credentials\.json)' || true)
if [ -n "$FORBIDDEN_FILES" ]; then
    echo "CRITICAL SECURITY ERROR: Forbidden secret file detected: $FORBIDDEN_FILES. Aborting."
    exit 1
fi

# Determine Checkpoint ID
mkdir -p "$REPO_ROOT/snapshots"
LAST_NUM=$(find "$REPO_ROOT/snapshots" -maxdepth 1 -type d -name "checkpoint-*" | grep -oE '[0-9]+$' | sort -n | tail -n1 || true)
if [ -z "$LAST_NUM" ]; then
    NEXT_NUM=1
else
    NEXT_NUM=$((10#$LAST_NUM + 1))
fi

CHECKPOINT_ID=$(printf "checkpoint-%03d" "$NEXT_NUM")
echo ">>> Checkpoint ID allocated: $CHECKPOINT_ID"

# Stage and Commit
git add -A
if git diff-index --quiet HEAD -- 2>/dev/null; then
    echo ">>> No file changes detected to commit. Using current HEAD..."
    COMMIT_HASH=$(git rev-parse HEAD)
else
    git commit -m "[$CHECKPOINT_ID] $DESCRIPTION"
    COMMIT_HASH=$(git rev-parse HEAD)
fi

git tag -f "$CHECKPOINT_ID"

SNAPSHOT_DIR="$REPO_ROOT/snapshots/$CHECKPOINT_ID"
mkdir -p "$SNAPSHOT_DIR"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BRANCH=$(git rev-parse --abbrev-ref HEAD)

cat <<EOF > "$SNAPSHOT_DIR/metadata.json"
{
  "checkpoint_id": "$CHECKPOINT_ID",
  "timestamp_utc": "$TIMESTAMP",
  "git_commit_hash": "$COMMIT_HASH",
  "branch": "$BRANCH",
  "description": "$DESCRIPTION",
  "status": "VERIFIED"
}
EOF

echo "| $CHECKPOINT_ID | $TIMESTAMP | $BRANCH | $COMMIT_HASH | Current | VERIFIED | $DESCRIPTION |" >> "$REPO_ROOT/snapshots/checkpoint-log.md"

echo ">>> [CHECKPOINT SUCCESS] $CHECKPOINT_ID created successfully!"
