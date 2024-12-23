#!/bin/bash

# Colors for logging
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}==>${NC} ${BLUE}$1${NC}"
}

log "Getting current version from package.json"
CURRENT_VERSION=$(node -p "require('./package.json').version")
NEW_VERSION=$((CURRENT_VERSION + 1))
log "Incrementing version from $CURRENT_VERSION to $NEW_VERSION"

log "Updating version in package.json"
node -e "const pkg=require('./package.json'); pkg.version=String($NEW_VERSION); require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2)+'\n')"

log "Removing local tag if it exists"
git tag -d v$NEW_VERSION 2>/dev/null || true

log "Remove remote tag if it exists"
git push --delete origin v$NEW_VERSION 2>/dev/null || true

log "Creating initial tag v$NEW_VERSION"
git tag v$NEW_VERSION

log "Generating changelog"
npm run changelog

log "Creating release commit"
git add package.json
git add CHANGELOG.md
git commit -m "Release v$NEW_VERSION"

log "Moving tag to include changelog"
git tag --delete v$NEW_VERSION
git tag v$NEW_VERSION

log "Pushing new tag"
git push --tags

log "Release v$NEW_VERSION completed! Now push latest commit and open depot PR 🎉"
