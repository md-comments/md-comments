#!/usr/bin/env bash
set -e

# ==============================================================================
# Packaging Script for Markdown Comments Safari macOS Release
# Generates a distributable .dmg containing the ad-hoc signed .app bundle
# and an /Applications symlink for frictionless drag-and-drop install.
# ==============================================================================

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$REPO_ROOT/safari-extension/build"
APP_PATH="$BUILD_DIR/Markdown Comments.app"
ARTIFACTS_DIR="$REPO_ROOT/artifacts"
DMG_NAME="Markdown-Comments-macOS.dmg"
DMG_PATH="$ARTIFACTS_DIR/$DMG_NAME"
TEMP_DMG_DIR="$BUILD_DIR/dmg-staging"

# Ensure app is built
if [ ! -d "$APP_PATH" ]; then
  echo "App bundle not found. Building Safari app first..."
  "$REPO_ROOT/scripts/build-safari-app.sh"
fi

echo "==> Packaging DMG for Markdown Comments macOS..."
mkdir -p "$ARTIFACTS_DIR"
rm -rf "$TEMP_DMG_DIR" "$DMG_PATH"
mkdir -p "$TEMP_DMG_DIR"

# Copy App into staging
cp -R "$APP_PATH" "$TEMP_DMG_DIR/"

# Create symlink to /Applications
ln -s /Applications "$TEMP_DMG_DIR/Applications"

# Create DMG using hdiutil
if command -v hdiutil &> /dev/null; then
  hdiutil create \
    -volname "Markdown Comments" \
    -srcfolder "$TEMP_DMG_DIR" \
    -ov \
    -format UDZO \
    "$DMG_PATH"

  echo "==> DMG successfully created at: $DMG_PATH"
else
  # Fallback to .zip if hdiutil is not available (e.g. non-macOS environment)
  cd "$BUILD_DIR"
  zip -r "$ARTIFACTS_DIR/Markdown-Comments-macOS.zip" "Markdown Comments.app"
  echo "==> ZIP archive successfully created at: $ARTIFACTS_DIR/Markdown-Comments-macOS.zip"
fi

rm -rf "$TEMP_DMG_DIR"
