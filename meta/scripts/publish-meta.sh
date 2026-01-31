#!/usr/bin/env bash

# load .env
if [ -f .env ]; then
	export $(grep -v '^#' .env | xargs)
fi

file="src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk"

ovr-platform-util upload-quest-build \
	--app-id "$OVR_APP_ID" \
	--app-secret "$OVR_APP_SECRET" \
	--apk "$file" \
	--channel LIVE
