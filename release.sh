#!/bin/bash
# Build, commit, and release the plugin with granular control
# Usage: ./release.sh 1.1.14 "Fix non-Steam game parsing" [--skip-version] [--skip-build] [--skip-commit] [--skip-release]
#   Or: ./release.sh 1.1.14 "Description" --only-build
#   Or: ./release.sh 1.1.14 "Description" --only-version
#   Or: ./release.sh 1.1.14 "Description" --only-release

set -e  # Exit on error

echo "======================================"
echo "Game Progress Tracker - Release Script"
echo "======================================"

# Check arguments
if [ -z "$1" ]; then
    echo "Usage: ./release.sh <version> [release-title] [options]"
    echo "Example: ./release.sh 1.1.14 'Fix non-Steam game parsing'"
    echo ""
    echo "Version should be numbers and dots only (e.g., 1.1.14)"
    echo ""
    echo "Options:"
    echo "  --skip-version     Skip version update"
    echo "  --skip-build       Skip frontend build"
    echo "  --skip-commit      Skip git commit"
    echo "  --skip-release     Skip GitHub release"
    echo ""
    echo "  --only-version     Only update version numbers"
    echo "  --only-build       Only build (skip version, commit, release)"
    echo "  --only-package     Only create package zip (skip version, build, commit, release)"
    echo "  --only-commit      Only commit and push (skip version, build, release)"
    echo "  --only-release     Only create GitHub release (skip version, build, commit)"
    echo ""
    echo "  --no-push          Don't push to git (useful with --only-commit)"
    exit 1
fi

# Version is numbers only (no 'v' prefix)
VERSION_NUM=$(echo "$1" | sed 's/^v//')
VERSION="$VERSION_NUM"
RELEASE_TITLE="${2:-$VERSION}"

# Parse flags
SKIP_VERSION=false
SKIP_BUILD=false
SKIP_COMMIT=false
SKIP_RELEASE=false
NO_PUSH=false
ONLY_MODE=""

shift 2 2>/dev/null || shift 1

for arg in "$@"; do
    case $arg in
        --skip-version) SKIP_VERSION=true ;;
        --skip-build) SKIP_BUILD=true ;;
        --skip-commit) SKIP_COMMIT=true ;;
        --skip-release) SKIP_RELEASE=true ;;
        --no-push) NO_PUSH=true ;;
        --only-version) ONLY_MODE="version" ;;
        --only-build) ONLY_MODE="build" ;;
        --only-package) ONLY_MODE="package" ;;
        --only-commit) ONLY_MODE="commit" ;;
        --only-release) ONLY_MODE="release" ;;
        *) echo "Unknown option: $arg"; exit 1 ;;
    esac
done

# Handle --only-* modes
if [ -n "$ONLY_MODE" ]; then
    case $ONLY_MODE in
        version)
            SKIP_BUILD=true
            SKIP_COMMIT=true
            SKIP_RELEASE=true
            ;;
        build)
            SKIP_VERSION=true
            SKIP_COMMIT=true
            SKIP_RELEASE=true
            ;;
        package)
            SKIP_VERSION=true
            SKIP_BUILD=true
            SKIP_COMMIT=true
            SKIP_RELEASE=true
            ;;
        commit)
            SKIP_VERSION=true
            SKIP_BUILD=true
            SKIP_RELEASE=true
            ;;
        release)
            SKIP_VERSION=true
            SKIP_BUILD=true
            SKIP_COMMIT=true
            ;;
    esac
fi

echo "Version: $VERSION"
echo "Release title: $RELEASE_TITLE"
echo ""
echo "Steps to execute:"
[ "$SKIP_VERSION" = false ] && echo "  ✓ Update version"
[ "$SKIP_BUILD" = false ] && echo "  ✓ Build frontend"
[ "$ONLY_MODE" = "package" ] && echo "  ✓ Create package"
[ "$SKIP_COMMIT" = false ] && echo "  ✓ Git commit $([ "$NO_PUSH" = true ] && echo '(no push)' || echo 'and push')"
[ "$SKIP_RELEASE" = false ] && echo "  ✓ GitHub release"
echo ""

# Step 1: Update version numbers
if [ "$SKIP_VERSION" = false ]; then
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
    echo ""
fi

# Step 2: Build frontend
if [ "$SKIP_BUILD" = false ]; then
    echo "Step 2: Building frontend..."
    npm install --silent
    npm run build

    if [ ! -f "dist/index.js" ]; then
        echo "ERROR: Build failed - dist/index.js not found"
        exit 1
    fi
    echo ""
fi

# Step 3: Create plugin package (always run unless in specific modes)
if [ "$SKIP_BUILD" = false ] || [ "$ONLY_MODE" = "package" ]; then
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
    echo ""
fi

# Step 4: Git commit and push
if [ "$SKIP_COMMIT" = false ]; then
    echo "Step 4: Committing changes..."
    git add -A
    git commit -m "${VERSION}: ${RELEASE_TITLE}

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

    if [ "$NO_PUSH" = false ]; then
        echo "  Pushing to origin..."
        git push origin main
    else
        echo "  Skipping push (--no-push)"
    fi
    echo ""
fi

# Step 5: Create and push tag (only if not skipping release)
if [ "$SKIP_RELEASE" = false ]; then
    echo "Step 5: Creating tag..."
    # Delete existing tag if present
    git tag -d "$VERSION" 2>/dev/null || true
    git push --delete origin "$VERSION" 2>/dev/null || true

    git tag -a "$VERSION" -m "${VERSION}: ${RELEASE_TITLE}"
    git push origin "$VERSION"
    echo ""
fi

# Step 6: Create GitHub release
if [ "$SKIP_RELEASE" = false ]; then
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
fi

echo "======================================"
echo "Complete!"
echo "======================================"
echo "Version: $VERSION"
[ "$SKIP_RELEASE" = false ] && echo "URL: https://github.com/maroun2/steam-deck-game-tags/releases/tag/$VERSION"
[ "$SKIP_RELEASE" = false ] && echo "Install URL: https://github.com/maroun2/steam-deck-game-tags/releases/download/${VERSION}/game-progress-tracker-${VERSION}.zip"
