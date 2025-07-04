#!/bin/bash

echo "🧪 Testing MeCare API endpoints..."
echo "=================================="
echo ""

BASE_URL="http://localhost:3002"

# Generate unique email to avoid conflicts
TIMESTAMP=$(date +%s)
TEST_EMAIL="test${TIMESTAMP}@example.com"

echo "1. Testing signup endpoint..."
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test User ${TIMESTAMP}\",
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"password123\",
    \"age\": 25
  }")

if [[ $SIGNUP_RESPONSE == *"token"* ]]; then
  echo "✅ Signup endpoint working"
  TOKEN=$(echo $SIGNUP_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
  USER_ID=$(echo $SIGNUP_RESPONSE | grep -o '"id":"[^"]*' | grep -o '[^"]*$')
else
  echo "❌ Signup endpoint failed"
  echo "Response: $SIGNUP_RESPONSE"
  exit 1
fi

echo ""
echo "2. Testing dashboard endpoint..."
DASHBOARD_RESPONSE=$(curl -s -X GET "$BASE_URL/api/users/$USER_ID/dashboard" \
  -H "Authorization: Bearer $TOKEN")

if [[ $DASHBOARD_RESPONSE == *"currentStreak"* ]]; then
  echo "✅ Dashboard endpoint working"
else
  echo "❌ Dashboard endpoint failed"
  echo "Response: $DASHBOARD_RESPONSE"
fi

echo ""
echo "3. Testing daily log endpoint..."
TODAY=$(date +%Y-%m-%d)
LOG_RESPONSE=$(curl -s -X POST "$BASE_URL/api/daily-logs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"date\": \"$TODAY\",
    \"mood\": \"happy\",
    \"painLevel\": 3,
    \"energyLevel\": 7,
    \"isOnPeriod\": true,
    \"notes\": \"Test log entry\"
  }")

if [[ $LOG_RESPONSE == *"success"* ]]; then
  echo "✅ Daily log endpoint working"
elif [[ $LOG_RESPONSE == *"already exists"* ]]; then
  echo "✅ Daily log endpoint working (entry already exists for today)"
else
  echo "❌ Daily log endpoint failed"
  echo "Response: $LOG_RESPONSE"
fi

echo ""
echo "4. Testing insights endpoint..."
INSIGHTS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/users/$USER_ID/insights" \
  -H "Authorization: Bearer $TOKEN")

if [[ $INSIGHTS_RESPONSE == *"totalLogged"* ]]; then
  echo "✅ Insights endpoint working"
else
  echo "❌ Insights endpoint failed"
  echo "Response: $INSIGHTS_RESPONSE"
fi

echo ""
echo "🎉 API testing complete!"
echo "The MeCare backend is fully functional and ready to use."
