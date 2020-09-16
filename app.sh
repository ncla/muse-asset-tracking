#!/usr/bin/env bash

LOCKFILE=.support/update.lock

if [ -f "$LOCKFILE" ] && kill -0 "$(cat $LOCKFILE)" 2>/dev/null; then
	echo Still running
	exit 1
fi

echo $$ > $LOCKFILE

echo "Downloading assets"
node download.js
echo "Prettifying assets"
./node_modules/prettier/bin-prettier.js --write assets/musemu.js assets/musemu.css

git add assets/
git commit -a -m "$(git status --porcelain | wc -l) files | $(git status --porcelain|awk '{print "basename " $2}'| sh | sed '{:q;N;s/\n/, /g;t q}')"
git push

rm $LOCKFILE