#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/run-agent.sh
# Fetches all open, unassigned issues and spawns a Claude worker for each one
# sequentially. Issues labelled 'not-ready' are skipped.

EXCLUDE_LABEL="not-ready"

echo "Fetching open unassigned issues (excluding '$EXCLUDE_LABEL')..."

mapfile -t issues < <(gh issue list \
  --json number,title,body,assignees,labels \
  --jq ".[] | select(
    (.assignees | length == 0) and
    (.labels | map(.name) | contains([\"$EXCLUDE_LABEL\"]) | not)
  ) | @json")

if [ ${#issues[@]} -eq 0 ]; then
  echo "No matching issues found."
  exit 0
fi

echo "Found ${#issues[@]} issue(s) to work on."

for issue_json in "${issues[@]}"; do
  number=$(echo "$issue_json" | jq -r '.number')
  title=$(echo "$issue_json" | jq -r '.title')
  body=$(echo "$issue_json" | jq -r '.body')

  echo ""
  echo "━━━ Issue #$number: $title ━━━"

  claude --dangerously-skip-permissions --print "Work on GitHub issue #$number.

Title: $title

Description:
$body

Instructions:
1. Assign the issue to yourself first: gh issue edit $number --add-assignee @me
2. Follow the GitHub PR workflow from CLAUDE.md:
   - Create a branch: git checkout -b fix/$number-short-description (or feat/ for features)
   - Follow TDD as described in CLAUDE.md
   - Run npm run ci before committing
   - Commit, push, and open a PR targeting master that links issue #$number"

  echo "━━━ Finished issue #$number ━━━"
done

echo ""
echo "All done."
