#!/usr/bin/env bash
# Restore numainda.dump into an empty local database, then verify it.
# Refuses to load into a database that already has public tables.
# Reset the volume with `docker compose down -v` before restoring again.

set -euo pipefail

lib_dir=$(cd "$(dirname "$0")" && pwd)
# shellcheck source=corpus-lib.sh
source "$lib_dir/corpus-lib.sh"

url="${LOCAL_DATABASE_URL:-}"
out_dir="${CORPUS_DIR:-/corpus}"
dump="$out_dir/numainda.dump"

if [[ -z "$url" ]]; then
  echo "LOCAL_DATABASE_URL is required." >&2
  exit 1
fi
if [[ ! -f "$dump" ]]; then
  echo "Dump not found at $dump. Run the snapshot first." >&2
  exit 1
fi

for _ in $(seq 1 30); do
  if psql "$url" --no-psqlrc -v ON_ERROR_STOP=1 -At -q -c 'SELECT 1' >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

existing=$(psql "$url" --no-psqlrc -v ON_ERROR_STOP=1 -At -q -c \
  "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'r'")
if [[ "$existing" != "0" ]]; then
  echo "Local database already has ${existing} public tables. Refusing to restore over them." >&2
  exit 1
fi

pg_restore \
  --exit-on-error \
  --no-owner \
  --no-privileges \
  --single-transaction \
  --dbname="$url" \
  "$dump"

"$lib_dir/corpus-verify.sh"
