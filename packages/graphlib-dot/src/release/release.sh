set -e
[ -n "$DEBUG" ] && set -x

PROJECT=graphlib-dot
VERSION=$(node src/release/check-version.js)

bail() {
    echo $1 >&2
    exit 1
}

# Preflight checks
# ----------------

echo Attempting to publish version: $VERSION

[ -z "`git tag -l v$VERSION`" ] || bail "ERROR: There is already a tag for: v$VERSION"
[ -n "`grep v$VERSION CHANGELOG.md`" ] || bail "ERROR: No entry for v$VERSION in CHANGELOG.md"
[ "`git symbolic-ref --short HEAD`" = "master" ] || bail "ERROR: You must release from the master branch"
[ -z "`git status --porcelain`" ] || bail "ERROR: Dirty index on working tree. Use git status to check"


# Publish tag
# -----------
git tag v$VERSION
git push origin
git push origin v$VERSION
echo Pushed tag v$VERSION to origin


# Publish docs + scripts
# ----------------------
echo Preparing to publish docs
PROJECT_ROOT=`pwd`
PUB_ROOT=/tmp/cpettitt-github-doc
rm -rf $PUB_ROOT
git clone git@github.com:cpettitt/cpettitt.github.com.git $PUB_ROOT
cd $PUB_ROOT

TARGET=project/$PROJECT/latest
git rm -r $TARGET || true
cp -r $PROJECT_ROOT/dist $TARGET
git add $TARGET

TARGET=project/$PROJECT/v$VERSION
cp -r $PROJECT_ROOT/dist $TARGET
git add $TARGET

git ci -m "Publish $PROJECT v$VERSION"
git push origin

# Cleanup
unset GIT_DIR
unset GIT_WORK_TREE
cd $PROJECT_ROOT
echo Done with docs


# Publish to npm
npm publish
echo Published to npm


# Update patch level version + commit
# -----------------------------------
node src/release/bump-version.js
git ci package.json -m "Bump version and set as pre-release"
git push origin
echo Updated patch version
