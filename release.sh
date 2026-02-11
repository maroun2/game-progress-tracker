#!/bin/bash
# Build, commit, and release the plugin
# Usage: ./release.sh v1.1.13 "Fix non-Steam game parsing"

set -e  # Exit on error

echo "======================================"
echo "Game Progress Tracker - Release Script"
echo "======================================"

# Check arguments
if [ -z "$1" ]; then
    echo "Usage: ./release.sh <version> [release-title]"
    echo "Example: ./release.sh v1.1.13 'Fix non-Steam game parsing'"
    exit 1
fi

VERSION="$1"
VERSION_NUM=$(echo "$VERSION" | sed 's/^v//')
RELEASE_TITLE="${2:-$VERSION}"

echo "Version: $VERSION"
echo "Release title: $RELEASE_TITLE"
echo ""

# Step 1: Update version numbers
echo "Step 1: Updating version numbers..."
sed -i.bak "s/\"version\": \".*\"/\"version\": \"$VERSION_NUM\"/" package.json
rm -f package.json.bak
sed -i.bak "s/\"version\": \".*\"/\"version\": \"$VERSION_NUM\"/" plugin.json
rm -f plugin.json.bak

# Verify versions
PACKAGE_VER=$(grep '"version"' package.json | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/')
PLUGIN_VER=$(grep '"version"' plugin.json | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/')
echo "  package.json: $PACKAGE_VER"
echo "  plugin.json: $PLUGIN_VER"

if [ "$PACKAGE_VER" != "$VERSION_NUM" ] || [ "$PLUGIN_VER" != "$VERSION_NUM" ]; then
    echo "ERROR: Version mismatch!"
    exit 1
fi

# Step 2: Build frontend
echo ""
echo "Step 2: Building frontend..."
npm install --silent
npm run build

if [ ! -f "dist/index.js" ]; then
    echo "ERROR: Build failed - dist/index.js not found"
    exit 1
fi

# Step 3: Create plugin package
echo ""
echo "Step 3: Creating plugin package..."
rm -rf plugin-build
rm -f game-progress-tracker-*.zip

mkdir -p plugin-build/game-progress-tracker/backend/src

# Copy backend
cp backend/src/database.py plugin-build/game-progress-tracker/backend/src/
cp backend/src/steam_data.py plugin-build/game-progress-tracker/backend/src/
cp backend/src/hltb_service.py plugin-build/game-progress-tracker/backend/src/
cp backend/src/__init__.py plugin-build/game-progress-tracker/backend/src/
cp backend/__init__.py plugin-build/game-progress-tracker/backend/

# Copy other files
cp -r dist plugin-build/game-progress-tracker/
cp main.py plugin-build/game-progress-tracker/
cp plugin.json plugin-build/game-progress-tracker/
cp package.json plugin-build/game-progress-tracker/
cp requirements.txt plugin-build/game-progress-tracker/
cp LICENSE plugin-build/game-progress-tracker/
cp README.md plugin-build/game-progress-tracker/
echo "$VERSION" > plugin-build/game-progress-tracker/VERSION

# Create zip
ZIP_NAME="game-progress-tracker-${VERSION}.zip"
cd plugin-build
zip -r "../$ZIP_NAME" game-progress-tracker
cd ..

SIZE=$(du -h "$ZIP_NAME" | cut -f1)
echo "  Created: $ZIP_NAME ($SIZE)"

# Step 4: Git commit and push
echo ""
echo "Step 4: Committing changes..."
git add -A
git commit -m "${VERSION}: ${RELEASE_TITLE}

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

echo "  Pushing to origin..."
git push origin main

# Step 5: Create and push tag
echo ""
echo "Step 5: Creating tag..."
# Delete existing tag if present
git tag -d "$VERSION" 2>/dev/null || true
git push --delete origin "$VERSION" 2>/dev/null || true

git tag -a "$VERSION" -m "${VERSION}: ${RELEASE_TITLE}"
git push origin "$VERSION"

# Step 6: Create GitHub release
echo ""
echo "Step 6: Creating GitHub release..."
# Delete existing release if present
gh release delete "$VERSION" --yes 2>/dev/null || true

INSTALL_URL="https://github.com/maroun2/steam-deck-game-tags/releases/download/${VERSION}/game-progress-tracker-${VERSION}.zip"

gh release create "$VERSION" "$ZIP_NAME" \
    --title "${VERSION} - ${RELEASE_TITLE}" \
    --notes "## Game Progress Tracker ${VERSION}

### Changes
- ${RELEASE_TITLE}

### Installation

**Install from URL (Recommended)**
1. Enable Developer Mode in Decky Loader settings
2. Go to Developer tab → Install Plugin from URL
3. Enter this URL:
\`\`\`
${INSTALL_URL}
\`\`\`
4. Click Install and wait for completion"

echo ""
echo "======================================"
echo "Release complete!"
echo "======================================"
echo "Version: $VERSION"
echo "URL: https://github.com/maroun2/steam-deck-game-tags/releases/tag/$VERSION"
echo "Install URL: $INSTALL_URL"
