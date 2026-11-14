#!/usr/bin/env bash
# Shared helpers for the local corpus snapshot and restore.
# These scripts read SOURCE_DATABASE_URL or LOCAL_DATABASE_URL from the
# environment. They do not print those URLs.

set -euo pipefail

corpus_manifest() {
  local url="$1"
  local snap="${2:-}"

  if [[ -z "$url" ]]; then
    echo "A database URL is required to write the manifest." >&2
    exit 1
  fi
  if [[ -n "$snap" && ! "$snap" =~ ^[0-9A-Fa-f]+-[0-9A-Fa-f]+-[0-9]+$ ]]; then
    echo "Refusing a snapshot id that does not look like a Postgres snapshot." >&2
    exit 1
  fi

  local snapshot_sql=""
  if [[ -n "$snap" ]]; then
    snapshot_sql="SET TRANSACTION SNAPSHOT '${snap}';"
  fi

  psql "$url" --no-psqlrc -v ON_ERROR_STOP=1 -At -q <<SQL
BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET DateStyle = 'ISO, MDY';
SET extra_float_digits = 3;
SET timezone = 'UTC';
${snapshot_sql}
SELECT 'server' || E'\t' || current_setting('server_version');
SELECT 'extension' || E'\t' || extname || E'\t' || coalesce(extversion, '')
FROM pg_extension
ORDER BY extname;
SELECT 'drizzle' || E'\t' || hash || E'\t' || created_at::text
FROM drizzle.__drizzle_migrations
ORDER BY created_at, id;
SELECT format(
\$\$SELECT %L || E'\t' || count(*)::text || E'\t' || md5(coalesce(string_agg(md5(row_to_json(t)::text), '' ORDER BY row_to_json(t)::text), '')) FROM %I.%I AS t\$\$,
  'table' || chr(9) || n.nspname || '.' || c.relname,
  n.nspname,
  c.relname
)
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind IN ('r', 'm')
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND n.nspname NOT LIKE 'pg_%'
ORDER BY n.nspname, c.relname
\\gexec
COMMIT;
SQL
}

corpus_migration_files() {
  local dir="$1"
  local journal="$dir/meta/_journal.json"
  if [[ ! -f "$journal" ]]; then
    echo "Migration journal not found at $journal" >&2
    exit 1
  fi

  while read -r tag when; do
    local file="$dir/${tag}.sql"
    if [[ ! -f "$file" ]]; then
      echo "Migration file not found: $file" >&2
      exit 1
    fi
    local sha
    sha=$(sha256sum "$file" | awk '{print $1}')
    printf 'file\t%s\t%s\t%s\n' "$tag" "$when" "$sha"
  done < <(
    awk '
      /"when"/ { when=$2; gsub(/[^0-9]/, "", when) }
      /"tag"/ {
        tag=$2
        gsub(/[^A-Za-z0-9_]/, "", tag)
        if (tag != "" && when != "") print tag, when
      }
    ' "$journal"
  )
}

# Pair file lines (file, tag, when, sha256) with drizzle lines (drizzle, sha256, created_at).
# Drizzle applies the next migration by comparing journal time with the latest
# created_at. It does not compare hashes, so both have to match before migrate.
corpus_pair_migrations() {
  local manifest="$1"
  awk -F '\t' '
    $1 == "drizzle" {
      sha = $2
      created = $3
      drizzle_sha[++dn] = sha
      drizzle_at[sha] = created
      drizzle_count[sha]++
    }
    $1 == "file" {
      tag = $2
      when = $3
      sha = $4
      file_tag[++fn] = tag
      file_when[tag] = when
      file_sha[tag] = sha
      file_for_sha[sha] = tag
    }
    END {
      bad = 0
      if (dn == 0) {
        print "manifest has no drizzle.__drizzle_migrations rows" > "/dev/stderr"
        bad = 1
      }
      if (fn == 0) {
        print "manifest has no migration file rows" > "/dev/stderr"
        bad = 1
      }
      for (sha in drizzle_count) {
        if (drizzle_count[sha] != 1) {
          print "duplicate drizzle hash " sha > "/dev/stderr"
          bad = 1
        }
      }
      for (i = 1; i <= fn; i++) {
        tag = file_tag[i]
        sha = file_sha[tag]
        when = file_when[tag]
        if (!(sha in drizzle_at)) {
          print "no drizzle row for " tag " sha256 " sha > "/dev/stderr"
          bad = 1
          continue
        }
        if (drizzle_at[sha] != when) {
          print "timestamp mismatch for " tag ": database " drizzle_at[sha] " journal " when > "/dev/stderr"
          bad = 1
        }
        matched[sha] = 1
      }
      for (i = 1; i <= dn; i++) {
        sha = drizzle_sha[i]
        if (!(sha in matched)) {
          print "drizzle row has no migration file: " sha " created_at " drizzle_at[sha] > "/dev/stderr"
          bad = 1
        }
      }
      if (bad) exit 1
    }
  ' "$manifest"
}
