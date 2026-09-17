#!/bin/sh
set -eu
mkdir -p /var/data/auth /var/data/uploads
chown node:node /var/data /var/data/auth /var/data/uploads
if [ ! -e /app/public/uploads ]; then
  ln -s /var/data/uploads /app/public/uploads
fi
exec gosu node node scripts/start-production.mjs
