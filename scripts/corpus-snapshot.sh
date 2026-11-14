#!/usr/bin/env bash
# Write a custom-format dump and a manifest from one Postgres snapshot.
# SOURCE_DATABASE_URL must be a direct database URL. A pooler in transaction
# mode cannot keep the exported snapshot open, and the manifest would then
# describe a different moment than the dump.

set -euo pipefail

lib_dir=$(cd "$(dirname "$0")" && pwd)
# shellcheck source=corpus-lib.sh
source "$lib_dir/corpus-lib.sh"

if [[ -z "${SOURCE_DATABASE_URL:-}" ]]; then
  echo "Set SOURCE_DATABASE_URL to a direct Postgres URL. Do not use a pooler." >&2
  exit 1
fi

out_dir="${CORPUS_DIR:-/corpus}"
mig_dir="${MIGRATIONS_DIR:-/migrations}"
mkdir -p "$out_dir"
umask 077

cleanup() {
  if [[ -n "${HOLD_PID:-}" ]] && kill -0 "$HOLD_PID" 2>/dev/null; then
    printf 'ROLLBACK;\n\\q\n' >&"${HOLD[1]}" 2>/dev/null || true
    kill "$HOLD_PID" 2>/dev/null || true
    wait "$HOLD_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

coproc HOLD {
  stdbuf -oL psql "$SOURCE_DATABASE_URL" --no-psqlrc -v ON_ERROR_STOP=1 -At -q
}

printf 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;\nSELECT pg_export_snapshot();\n' >&"${HOLD[1]}"

snap=""
if ! IFS= read -r -t 60 snap <&"${HOLD[0]}"; then
  echo "The snapshot session closed before Postgres exported a snapshot. Use a direct database URL, not a pooler." >&2
  exit 1
fi
if [[ ! "$snap" =~ ^[0-9A-Fa-f]+-[0-9A-Fa-f]+-[0-9]+$ ]]; then
  echo "Postgres did not return a snapshot id. Use a direct database URL, not a pooler." >&2
  exit 1
fi

echo "Exported snapshot ${snap}"

pg_dump "$SOURCE_DATABASE_URL" \
  --snapshot="$snap" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="$out_dir/numainda.dump"

{
  corpus_manifest "$SOURCE_DATABASE_URL" "$snap"
  corpus_migration_files "$mig_dir"
} >"$out_dir/manifest.tsv"

corpus_pair_migrations "$out_dir/manifest.tsv"

printf 'COMMIT;\n\\q\n' >&"${HOLD[1]}"
wait "$HOLD_PID"
HOLD_PID=""

echo "Wrote ${out_dir}/numainda.dump and ${out_dir}/manifest.tsv"
