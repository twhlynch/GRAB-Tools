#!/usr/bin/env bash

if [ "$(whoami)" != "twhlynch" ]; then
	echo "Not intended to be ran by others"
	exit 1
fi

dest_dir="public/levels/lobbies"
source_dir="../../root/Games/GRAB-Game/levels/lobbies"

cp -r "$source_dir"/* "$dest_dir"/
