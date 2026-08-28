#!/usr/bin/env bash
# Assembles a loadable extension per browser from the shared sources in src/
# plus the matching manifest in manifests/. Everything under dist/ is generated.
set -euo pipefail

cd "$(dirname "$0")"
targets=("$@")
if [ ${#targets[@]} -eq 0 ]; then targets=(chrome firefox); fi

# the manifests carry their own version string; drift breaks store uploads
versions=$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' manifests/*.json | sort -u | wc -l)
if [ "$versions" -ne 1 ]; then
  echo "warning: manifest versions differ across manifests/*.json" >&2
fi

for target in "${targets[@]}"; do
  manifest="manifests/$target.json"
  if [ ! -f "$manifest" ]; then
    echo "error: no manifest for '$target' ($manifest)" >&2
    exit 1
  fi
  out="dist/$target"
  rm -rf "$out"
  mkdir -p "$out"
  cp -R src/. "$out/"
  cp "$manifest" "$out/manifest.json"
  echo "built $out"
done
