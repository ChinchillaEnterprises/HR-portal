#!/bin/bash

# Create node_modules directory if it doesn't exist
mkdir -p node_modules

# Use npx to run Next.js directly
echo "Starting Next.js development server..."
npx next@14.2.10 dev -p 3002