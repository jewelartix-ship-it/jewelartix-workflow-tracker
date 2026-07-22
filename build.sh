#!/bin/bash
set -e
echo "=== BUILD SCRIPT START ==="
echo "Initial pwd: $(pwd)"
echo "Initial ls:"
ls -la
echo ""
echo "=== Entering frontend/ ==="
cd frontend
echo "pwd now: $(pwd)"
echo "ls now:"
ls -la
echo ""
echo "=== npm ci in frontend/ (--include=dev forces devDependencies regardless of NODE_ENV) ==="
rm -rf node_modules
npm cache clean --force
npm ci --include=dev
echo ""
echo "=== npm run build in frontend/ ==="
npm run build
echo ""
echo "=== Entering backend/ ==="
cd ../backend
echo "pwd now: $(pwd)"
echo "ls now:"
ls -la
echo ""
echo "=== npm ci in backend/ (--include=dev forces devDependencies regardless of NODE_ENV) ==="
rm -rf node_modules
npm cache clean --force
npm ci --include=dev
echo ""
echo "=== BUILD SCRIPT DONE ==="
