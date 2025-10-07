#!/bin/bash

# Quick Deployment Script
# This script helps you deploy to Vercel/Railway

echo "🚀 Trick Card Game - Deployment Helper"
echo "========================================"
echo ""

# Check if git remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  No git remote found!"
    echo ""
    echo "First, create a GitHub repository at: https://github.com/new"
    echo ""
    echo "Then run:"
    echo "  git remote add origin https://github.com/YOUR_USERNAME/trick-card-game.git"
    echo "  git branch -M main"
    echo "  git push -u origin main"
    echo ""
    exit 1
fi

echo "✅ Git remote configured"
echo ""

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  You have uncommitted changes!"
    echo ""
    echo "Commit your changes first:"
    echo "  git add ."
    echo "  git commit -m 'Your commit message'"
    echo ""
    exit 1
fi

echo "✅ Working directory clean"
echo ""

# Push to remote
echo "📤 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Pushed to GitHub successfully!"
    echo ""
    echo "📋 Next Steps:"
    echo ""
    echo "1. Set up Vercel Postgres:"
    echo "   → https://vercel.com/dashboard/storage"
    echo ""
    echo "2. Deploy Backend to Railway:"
    echo "   → https://railway.app"
    echo "   → Root Directory: backend"
    echo "   → Add environment variables (see NEXT_STEPS.md)"
    echo ""
    echo "3. Deploy Frontend to Vercel:"
    echo "   → https://vercel.com/new"
    echo "   → Root Directory: frontend"
    echo "   → Add VITE_SOCKET_URL environment variable"
    echo ""
    echo "📖 See NEXT_STEPS.md for detailed instructions!"
    echo ""
else
    echo "❌ Failed to push to GitHub"
    echo ""
    echo "Make sure you have:"
    echo "  1. Created the GitHub repository"
    echo "  2. Added the remote: git remote add origin <url>"
    echo "  3. Have permissions to push"
    echo ""
fi
