#!/bin/sh
cd "$(dirname "$0")/Pato/backend" && npm ci && npx prisma generate
