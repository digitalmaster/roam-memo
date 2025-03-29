#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Colors for logging
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default mode is "new"
MODE="new"

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --amend) MODE="amend" ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Logging function
log() {
    echo -e "${GREEN}==>${NC} ${BLUE}$1${NC}"
}

error() {
    echo -e "${RED}ERROR:${NC} $1"
    exit 1
}

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    error "You have uncommitted changes. Please commit or stash them before running this script."
fi

# Store the current branch name
CURRENT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "")
if [ -z "$CURRENT_BRANCH" ]; then
    error "You are in a detached HEAD state. Please checkout a branch before running this script."
fi
log "Current branch: $CURRENT_BRANCH"

log "Getting current version from package.json"
CURRENT_VERSION=$(node -p "require('./package.json').version")

if [ "$MODE" = "new" ]; then
    NEW_VERSION=$((CURRENT_VERSION + 1))
else
    NEW_VERSION=$CURRENT_VERSION

    # Store the release commit hash before removing the tag
    log "Finding the release commit"
    RELEASE_COMMIT=$(git rev-list -n 1 v$NEW_VERSION 2>/dev/null)

    if [ -z "$RELEASE_COMMIT" ]; then
        error "Could not find commit for tag v$NEW_VERSION. Make sure the tag exists before running in amend mode."
    fi

    log "Release commit found: ${RELEASE_COMMIT:0:8}"
fi

# Remove local and remote tags
log "Removing local tag if it exists"
git tag -d v$NEW_VERSION 2>/dev/null || true

log "Remove remote tag if it exists"
git push --delete origin v$NEW_VERSION 2>/dev/null || true

if [ "$MODE" = "new" ]; then
    log "Incrementing version from $CURRENT_VERSION to $NEW_VERSION"
    log "Updating version in package.json"
    node -e "const pkg=require('./package.json'); pkg.version=String($NEW_VERSION); require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2)+'\n')"
else
    log "Amending existing release v$NEW_VERSION"

    # Remove the release commit using git rebase --onto
    log "Removing the release commit using git rebase"
    git rebase --onto $RELEASE_COMMIT^ $RELEASE_COMMIT HEAD || {
        error "Rebase failed. You may need to resolve conflicts manually and then run 'git rebase --continue'."
    }

    # Make sure to update the version in package.json after removing the release commit
    log "Ensuring version in package.json is set to $NEW_VERSION"
    node -e "const pkg=require('./package.json'); pkg.version=String($NEW_VERSION); require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2)+'\n')"
fi

# We need to do this so that when we run changelog it has a new tag to compare it to.
log "Creating initial tag v$NEW_VERSION"
git tag v$NEW_VERSION || error "Failed to create tag"

log "Generating changelog"
npm run changelog || error "Failed to generate changelog"

log "Creating release commit"
git add package.json CHANGELOG.md || error "Failed to stage files for commit"
git commit -m "Release v$NEW_VERSION" || error "Failed to create release commit"

log "Moving tag to include changelog"
git tag --delete v$NEW_VERSION || error "Failed to delete tag v$NEW_VERSION"
git tag v$NEW_VERSION || error "Failed to create tag"

log "Pushing new tag"
git push origin v$NEW_VERSION || error "Failed to push tag v$NEW_VERSION"

# Make sure we're back on the original branch
if [ "$MODE" = "amend" ]; then
    log "Updating $CURRENT_BRANCH branch to point to the new HEAD"
    TEMP_HEAD=$(git rev-parse HEAD)
    git checkout $CURRENT_BRANCH
    git reset --hard $TEMP_HEAD
fi

if [ "$MODE" = "new" ]; then
    log "Release v$NEW_VERSION completed! Now push latest commit and open depot PR 🎉"
else
    log "Release v$NEW_VERSION amended! Now push latest commit with --force 🎉"
fi
