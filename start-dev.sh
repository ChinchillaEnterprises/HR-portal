#!/bin/bash
set -euo pipefail

PORT=${PORT:-3002}

# Ensure dirs
mkdir -p node_modules logs

echo "Starting Next.js development server on port ${PORT}..."

# Use local Next.js binary to avoid network fetch
if [ ! -x "node_modules/.bin/next" ]; then
  echo "Next.js binary not found. Run 'npm install' first."
  exit 1
fi

# Start and log output
nohup node_modules/.bin/next dev -p "${PORT}" > logs/dev.log 2>&1 &
echo $! > logs/dev.pid
echo "Dev server PID $(cat logs/dev.pid). Logs: logs/dev.log"
