#!/usr/bin/env bash
# Compare a restored database with the manifest written beside the dump.
# Ignores the server version line, because the local image is Postgres 15
# and the hosted database may be a later 15.x minor. Everything else must match.
# Recomputes migration file hashes from the repository before pairing them
# with drizzle.__drizzle_migrations.

set -euo pipefail

lib_dir=$(cd "$(dirname "$0")" && pwd)
# shellcheck source=corpus-lib.sh
source "$lib_dir/corpus-lib.sh"

url="${LOCAL_DATABASE_URL:-}"
out_dir="${CORPUS_DIR:-/corpus}"
mig_dir="${MIGRATIONS_DIR:-/migrations}"
manifest="$out_dir/manifest.tsv"

if [[ -z "$url" ]]; then
  echo "LOCAL_DATABASE_URL is required." >&2
  exit 1
fi
if [[ ! -f "$manifest" ]]; then
  echo "Manifest not found at $manifest. Run the snapshot first." >&2
  exit 1
fi

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

corpus_manifest "$url" >"$work/fresh.tsv"
corpus_migration_files "$mig_dir" >"$work/files.tsv"

grep -v -e '^server	' -e '^file	' "$manifest" | sort >"$work/expected.tsv"
grep -v -e '^server	' "$work/fresh.tsv" | sort >"$work/actual.tsv"

echo "Source $(grep '^server	' "$manifest" || true)"
echo "Local  $(grep '^server	' "$work/fresh.tsv" || true)"

if ! diff -u "$work/expected.tsv" "$work/actual.tsv"; then
  echo "Restored database does not match the snapshot manifest." >&2
  exit 1
fi

cat "$work/fresh.tsv" "$work/files.tsv" >"$work/paired.tsv"
corpus_pair_migrations "$work/paired.tsv"

bills=$(awk -F '\t' '$1 == "table" && $2 == "public.bills" { print $3 }' "$work/fresh.tsv")
echo "Manifest matches. public.bills count is ${bills:-missing}."
echo "GET /api/bills pagination.totalCount should equal that count."
