#!/usr/bin/env sh

set -eu

if ! command -v gitleaks >/dev/null 2>&1; then
  echo "Gitleaks is required for pre-commit scanning."
  echo "Install it first, then retry the commit."
  echo "Install guide: https://github.com/gitleaks/gitleaks"
  exit 1
fi

staged_files="$(git diff --cached --name-only --diff-filter=ACMR)"

if [ -z "$staged_files" ]; then
  exit 0
fi

tmp_root="${TMPDIR:-/tmp}"
tmp_dir="$(mktemp -d "$tmp_root/gitleaks-staged.XXXXXX")"

cleanup() {
  rm -rf "$tmp_dir"
}

trap cleanup EXIT INT TERM

while IFS= read -r path; do
  [ -n "$path" ] || continue

  parent_dir="$(dirname "$path")"
  mkdir -p "$tmp_dir/$parent_dir"
  git show ":$path" > "$tmp_dir/$path"
done <<EOF
$staged_files
EOF

echo "Scanning staged changes for secrets with Gitleaks..."
gitleaks dir --no-banner --redact "$tmp_dir"
