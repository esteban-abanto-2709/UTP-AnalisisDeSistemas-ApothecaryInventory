#!/bin/sh
set -e

node_modules/.bin/prisma migrate deploy

if [ "${SEED_MODE:-none}" != "none" ]; then
  node dist-seed/prisma/seed.js
fi

exec node dist/main
