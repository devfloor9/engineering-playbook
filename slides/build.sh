#!/bin/bash
# Build all slide blocks and copy to static directory
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
STATIC_DIR="$REPO_ROOT/static/docs/operations-observability/slide"

# Build a single block
build_block() {
  local block_dir="$1"
  local block_name="$(basename "$block_dir")"

  echo "Building $block_name..."
  cd "$block_dir"

  # Install dependencies if node_modules missing
  if [ ! -d "node_modules" ]; then
    npm install
  fi

  # Build
  npm run build

  # Copy to static
  local target="$STATIC_DIR/$block_name"
  rm -rf "$target"
  cp -r dist "$target"

  echo "$block_name built successfully."
}

# Build all blocks
echo "=== Building all slide blocks ==="

for block_dir in "$SCRIPT_DIR"/block*/; do
  if [ -d "$block_dir" ]; then
    build_block "$block_dir"
  fi
done

# Copy landing page
if [ -f "$SCRIPT_DIR/index.html" ]; then
  cp "$SCRIPT_DIR/index.html" "$STATIC_DIR/index.html"
fi

echo ""
echo "=== All blocks built and copied to $STATIC_DIR ==="
echo "Deploy by committing and pushing to main."
