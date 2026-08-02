#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# Change directory to the repository root
cd "$(dirname "$0")/.."

# Load credentials from .env
if [ -f .env ]; then
  echo "Loading environment from .env..."
  export $(grep -v '^#' .env | xargs)
else
  echo "Warning: .env file not found."
fi

# Dry run flag
DRY_RUN=false
if [ "$1" = "--dry-run" ]; then
  DRY_RUN=true
  echo "Running in DRY-RUN mode. Workflow will be validated but commands not executed."
fi

# Ensure act is installed
if ! command -v act &> /dev/null; then
  echo "Error: 'act' is not installed. Please install it using 'brew install act' or your package manager."
  exit 1
fi

# Ensure Docker is running
if ! docker info &> /dev/null; then
  echo "Error: Docker daemon is not running. Please start Docker."
  exit 1
fi

# 1. Clean and recreate artifacts directory
echo "Cleaning and preparing artifacts directory..."
rm -rf artifacts
mkdir -p artifacts

# 2. Build the project
echo "Building the project..."
pnpm build

# 3. Package VS Code Extension
echo "Packaging VS Code extension..."
cd vscode-extension
# Backup and remove pre-publish script to prevent conflicts during local vsce run
node -e "const fs = require('fs'); const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')); pkg.scripts['vscode:prepublish_backup'] = pkg.scripts['vscode:prepublish']; delete pkg.scripts['vscode:prepublish']; fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));"
pnpm dlx vsce-pnpm package --pnpm
node -e "const fs = require('fs'); const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')); pkg.scripts['vscode:prepublish'] = pkg.scripts['vscode:prepublish_backup']; delete pkg.scripts['vscode:prepublish_backup']; fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));"
mv *.vsix ../artifacts/
cd ..

# 4. Package Chrome Extension
echo "Packaging Chrome extension..."
cd chrome-extension/dist
zip -r ../../artifacts/chrome-extension.zip .
cd ../..

echo "Artifacts prepared successfully in $(pwd)/artifacts:"
ls -la artifacts

# 5. Create event.json
echo "Creating temporary event.json..."
cat <<EOF > event.json
{
  "action": "published",
  "release": {
    "tag_name": "v1.0.1",
    "draft": false,
    "prerelease": false
  }
}
EOF

# Unset invalid environment GITHUB_TOKEN to prevent authentication failures when act clones public actions
if [[ "$GITHUB_TOKEN" == *"antigravity"* || "$GITHUB_TOKEN" == *"dummy"* ]]; then
  echo "Detected dummy GITHUB_TOKEN from agent environment. Unsetting it for act."
  unset GITHUB_TOKEN
fi

# 6. Run act
echo "Running GitHub Actions workflow locally via act..."
ACT_ARGS=(
  "release"
  "-W" ".github/workflows/deploy-marketplaces.yml"
  "-e" "event.json"
  "--secret-file" ".env"
)

if [ "$DRY_RUN" = true ]; then
  # -n / --dryrun runs act in dry-run mode
  ACT_ARGS+=("-n")
fi

# Temporarily comment out *.vsix from .gitignore so act copies the built artifacts to the container
if [ -f .gitignore ]; then
  sed -i.bak 's/^\*\.vsix/# *.vsix/' .gitignore
fi

# Run act and capture status
ACT_STATUS=0
act "${ACT_ARGS[@]}" || ACT_STATUS=$?

# Restore .gitignore
if [ -f .gitignore.bak ]; then
  mv .gitignore.bak .gitignore
fi

# Clean up temporary event.json
rm -f event.json

if [ $ACT_STATUS -ne 0 ]; then
  echo "Error: Local publish run failed."
  exit $ACT_STATUS
fi
echo "Local publish test completed successfully."
