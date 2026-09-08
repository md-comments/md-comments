#!/usr/bin/env bash
set -e

# ==============================================================================
# Build Script for Markdown Comments Safari Web Extension (macOS)
# Builds web assets, compiles Swift companion app & app extension,
# generates app icon, and applies ad-hoc signature for zero-cost self-signed distribution.
# ==============================================================================

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHROME_EXT_DIR="$REPO_ROOT/chrome-extension"
SAFARI_SRC_DIR="$REPO_ROOT/safari-extension/src"
BUILD_DIR="$REPO_ROOT/safari-extension/build"
APP_NAME="Markdown Comments"
APP_BUNDLE="$BUILD_DIR/$APP_NAME.app"
APPEX_NAME="Markdown Comments Extension"
APPEX_BUNDLE="$APP_BUNDLE/Contents/PlugIns/$APPEX_NAME.appex"

echo "==> Step 1: Building Safari WebExtension assets..."
cd "$CHROME_EXT_DIR"
node esbuild.js production --target=safari

echo "==> Step 2: Preparing native macOS App bundle structure..."
rm -rf "$BUILD_DIR"
mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources"
mkdir -p "$APP_BUNDLE/Contents/PlugIns"
mkdir -p "$APPEX_BUNDLE/Contents/MacOS"
mkdir -p "$APPEX_BUNDLE/Contents/Resources"

# Generate AppIcon.icns if sips and iconutil are available
ICON_SRC="$REPO_ROOT/assets/icon.png"
if [ -f "$ICON_SRC" ] && command -v sips &> /dev/null && command -v iconutil &> /dev/null; then
  echo "==> Generating AppIcon.icns from assets/icon.png..."
  ICONSET_DIR="/tmp/MDCommentsAppIcon.iconset"
  rm -rf "$ICONSET_DIR"
  mkdir -p "$ICONSET_DIR"
  sips -z 16 16     "$ICON_SRC" --out "$ICONSET_DIR/icon_16x16.png" > /dev/null
  sips -z 32 32     "$ICON_SRC" --out "$ICONSET_DIR/icon_16x16@2x.png" > /dev/null
  sips -z 32 32     "$ICON_SRC" --out "$ICONSET_DIR/icon_32x32.png" > /dev/null
  sips -z 64 64     "$ICON_SRC" --out "$ICONSET_DIR/icon_32x32@2x.png" > /dev/null
  sips -z 128 128   "$ICON_SRC" --out "$ICONSET_DIR/icon_128x128.png" > /dev/null
  sips -z 256 256   "$ICON_SRC" --out "$ICONSET_DIR/icon_128x128@2x.png" > /dev/null
  sips -z 256 256   "$ICON_SRC" --out "$ICONSET_DIR/icon_256x256.png" > /dev/null
  sips -z 512 512   "$ICON_SRC" --out "$ICONSET_DIR/icon_256x256@2x.png" > /dev/null
  sips -z 512 512   "$ICON_SRC" --out "$ICONSET_DIR/icon_512x512.png" > /dev/null
  iconutil -c icns "$ICONSET_DIR" -o "$APP_BUNDLE/Contents/Resources/AppIcon.icns"
  cp "$APP_BUNDLE/Contents/Resources/AppIcon.icns" "$APPEX_BUNDLE/Contents/Resources/AppIcon.icns"
  cp "$ICON_SRC" "$APP_BUNDLE/Contents/Resources/AppIcon.png"
  rm -rf "$ICONSET_DIR"
fi

# Copy Info.plist files
cp "$SAFARI_SRC_DIR/App/Info.plist" "$APP_BUNDLE/Contents/Info.plist"
cp "$SAFARI_SRC_DIR/Extension/Info.plist" "$APPEX_BUNDLE/Contents/Info.plist"

# Copy WebExtension resources into the extension bundle
echo "==> Step 3: Copying WebExtension resources into App Extension..."
cp -R "$CHROME_EXT_DIR/dist/safari/"* "$APPEX_BUNDLE/Contents/Resources/"

echo "==> Step 4: Compiling native Swift binaries..."
# Compile App Extension Mach-O executable
swiftc -O \
  -target arm64-apple-macosx12.0 \
  "$SAFARI_SRC_DIR/Extension/SafariExtensionHandler.swift" \
  -o "$APPEX_BUNDLE/Contents/MacOS/$APPEX_NAME"

# Compile Host macOS Application executable
swiftc -O \
  -target arm64-apple-macosx12.0 \
  "$SAFARI_SRC_DIR/App/main.swift" \
  -o "$APP_BUNDLE/Contents/MacOS/$APP_NAME"

echo "==> Step 5: Applying ad-hoc code signature with App Sandbox entitlements..."
codesign --force --sign - --entitlements "$SAFARI_SRC_DIR/Extension/Extension.entitlements" "$APPEX_BUNDLE"
codesign --force --sign - --entitlements "$SAFARI_SRC_DIR/App/App.entitlements" "$APP_BUNDLE"

echo "==> Build complete successfully!"
echo "    App bundle location: $APP_BUNDLE"
echo "    To test in Safari:"
echo "    1. In Safari: Develop menu -> Allow Unsigned Extensions"
echo "    2. Open: open \"$APP_BUNDLE\""
echo "    3. Enable in Safari Settings -> Extensions"
echo "    4. On github.com, click extension icon -> Always Allow on This Website"
