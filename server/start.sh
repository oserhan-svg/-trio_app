#!/bin/sh

# [OPTIMIZATION] Run DB sync in the background so the server can start instantly
echo "🚀 Starting Database Synchronization in background..."
npx prisma db push --accept-data-loss &

# Start the main application immediately
echo "✨ Starting Node.js server..."
exec npm start
