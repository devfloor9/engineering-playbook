#!/bin/bash
# Build all slide blocks and copy to static directory
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
EKS_STATIC_DIR="$REPO_ROOT/static/docs/operations-observability/slide"
AGENTIC_STATIC_DIR="$REPO_ROOT/static/docs/agentic-ai-platform/slide"

# Build a single block and copy to target dir
build_block() {
  local block_dir="$1"
  local target_dir="$2"
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
  local target="$target_dir/$block_name"
  rm -rf "$target"
  cp -r dist "$target"

  echo "$block_name built successfully."
}

# Build EKS blocks
echo "=== Building EKS slide blocks ==="
mkdir -p "$EKS_STATIC_DIR"

for block_dir in "$SCRIPT_DIR"/block*/; do
  if [ -d "$block_dir" ]; then
    build_block "$block_dir" "$EKS_STATIC_DIR"
  fi
done

# Copy EKS landing page
if [ -f "$SCRIPT_DIR/index.html" ]; then
  cp "$SCRIPT_DIR/index.html" "$EKS_STATIC_DIR/index.html"
fi

# Build Agentic AI blocks
echo ""
echo "=== Building Agentic AI slide blocks ==="
mkdir -p "$AGENTIC_STATIC_DIR"

for block_dir in "$SCRIPT_DIR"/agentic-block*/; do
  if [ -d "$block_dir" ]; then
    build_block "$block_dir" "$AGENTIC_STATIC_DIR"
  fi
done

# Copy Agentic AI landing page
if [ -f "$SCRIPT_DIR/agentic-index.html" ]; then
  cp "$SCRIPT_DIR/agentic-index.html" "$AGENTIC_STATIC_DIR/index.html"
fi

echo ""
echo "=== All blocks built ==="
echo "  EKS slides:     $EKS_STATIC_DIR"
echo "  Agentic slides:  $AGENTIC_STATIC_DIR"
echo "Deploy by committing and pushing to main."
