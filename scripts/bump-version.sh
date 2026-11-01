#!/usr/bin/env bash

# get old version from package.json
old_version=$(node -p "require('./website/package.json').version")

# update with pnpm
pnpm version "$1" --no-git-tag-version
pnpm config set git-checks false
cd website
pnpm version "$1" --no-git-tag-version
cd -
cd lib
pnpm version "$1" --no-git-tag-version
cd -
pnpm config set git-checks true

# get new version from package.json
new_version=$(node -p "require('./website/package.json').version")

# format android version
IFS='.' read -r major minor patch <<<"$new_version"
if [ "${major}" = "0" ]; then
	android_version=$(printf "%02d%02d" "${minor}" "${patch}")
else
	android_version=$(printf "%d%02d%02d" "${major}" "${minor}" "${patch}")
fi

# update version in tauri.properties
cat <<EOF >website/src-tauri/gen/android/app/tauri.properties
tauri.android.versionName=${new_version}
tauri.android.versionCode=${android_version}
EOF

# update version in Cargo.toml
sed -i '' "s/^version = \"${old_version}\"/version = \"${new_version}\"/" website/src-tauri/Cargo.toml

# run cargo check to update lock
cd website/src-tauri
cargo check
cd -

# add modified files and commit
git add package.json pnpm-lock.yaml pnpm-workspace.yaml website/package.json lib/package.json website/src-tauri/Cargo.toml website/src-tauri/Cargo.lock website/src-tauri/gen/android/app/tauri.properties
git commit -m "chore: bump version to ${new_version}"
