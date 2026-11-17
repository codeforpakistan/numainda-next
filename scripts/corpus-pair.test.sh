#!/usr/bin/env bash
# Pairing checks for the corpus manifest. No database.
set -euo pipefail

lib_dir=$(cd "$(dirname "$0")" && pwd)
# shellcheck source=corpus-lib.sh
source "$lib_dir/corpus-lib.sh"

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

pass() {
  if ! corpus_pair_migrations "$1" 2>"$work/err"; then
    echo "expected pass: $2" >&2
    cat "$work/err" >&2
    exit 1
  fi
}

fail() {
  if corpus_pair_migrations "$1" 2>"$work/err"; then
    echo "expected failure: $2" >&2
    exit 1
  fi
}

printf 'drizzle\tabc\t100\nfile\t0000_base\t100\tabc\nfile\t0007_ledger_listings\t200\tdef\n' >"$work/pending.tsv"
pass "$work/pending.tsv" "newer journal file is pending"
grep -q "pending 0007_ledger_listings" "$work/err"

printf 'drizzle\tabc\t100\nfile\t0000_base\t100\tabc\nfile\t0001_old\t50\tdef\n' >"$work/old.tsv"
fail "$work/old.tsv" "older unmatched file"

printf 'drizzle\tabc\t100\nfile\t0000_base\t90\tabc\n' >"$work/time.tsv"
fail "$work/time.tsv" "timestamp mismatch"

printf 'drizzle\tabc\t100\ndrizzle\tdef\t200\nfile\t0000_base\t100\tabc\n' >"$work/extra.tsv"
fail "$work/extra.tsv" "drizzle row without a file"

printf 'drizzle\tabc\t100\nfile\t0000_base\t100\tabc\n' >"$work/exact.tsv"
pass "$work/exact.tsv" "exact snapshot"

echo "corpus pair checks passed"
