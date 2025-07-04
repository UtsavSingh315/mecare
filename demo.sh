#!/bin/bash

# MeCare Demo Script
# This script demonstrates the complete functionality of the integrated app

echo "🌸 Welcome to MeCare - Period Tracking App Demo"
echo "==============================================="
echo ""

echo "📋 Setting up the demo environment..."

# Ensure test users exist
echo "Creating test users in the database..."
npm run db:create-users

echo ""
echo "🚀 Starting the development server..."
echo "The app will be available at: http://localhost:3000"
echo ""

echo "📝 Demo Steps:"
echo "1. Visit http://localhost:3000"
echo "2. You'll see the welcome screen (unauthenticated)"
echo "3. Click 'Create Account' or 'Sign In'"
echo "4. Test with existing user: jane@example.com / password123"
echo "5. After login, explore:"
echo "   - Dashboard: Shows real user data and statistics"
echo "   - Log: Add daily symptoms, mood, pain levels"
echo "   - Calendar: View your logged data"
echo "   - Insights: See charts and patterns (after logging data)"
echo "   - Settings: Manage account and preferences"
echo ""

echo "✨ Key Features to Test:"
echo "- Authentication (login/signup/logout)"
echo "- Real-time dashboard updates"
echo "- Daily logging with database storage"
echo "- Data visualization in insights"
echo "- Route protection (try accessing pages without login)"
echo "- Session persistence (refresh page, stay logged in)"
echo ""

echo "🔧 Database Commands Available:"
echo "- npm run db:init      # Initialize database"
echo "- npm run db:seed      # Seed with sample data"
echo "- npm run db:migrate   # Run migrations"
echo "- npm run db:studio    # Open Drizzle Studio"
echo ""

# Start the development server
npm run dev
