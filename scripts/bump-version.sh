#!/usr/bin/env bash

# get old version from package.json
old_version=$(node -p "require('./package.json').version")

# update with npm
npm version "$1" --no-git-tag-version

# get new version from package.json
new_version=$(node -p "require('./package.json').version")

# format android version
IFS='.' read -r major minor patch <<<"$new_version"
if [ "${major}" = "0" ]; then
	android_version=$(printf "%02d%02d" "${minor}" "${patch}")
else
	android_version=$(printf "%d%02d%02d" "${major}" "${minor}" "${patch}")
fi

# update version in tauri.properties
cat <<EOF >src-tauri/gen/android/app/tauri.properties
tauri.android.versionName=${new_version}
tauri.android.versionCode=${android_version}
EOF

# update version in Cargo.toml
sed -i '' "s/^version = \"${old_version}\"/version = \"${new_version}\"/" src-tauri/Cargo.toml

# run cargo check to update lock
cd src-tauri
cargo check
cd ..

# add modified files and commit
git add package.json package-lock.json src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/gen/android/app/tauri.properties
git commit -m "chore: bump version to ${new_version}"
