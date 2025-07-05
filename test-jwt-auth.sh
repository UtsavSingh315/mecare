#!/bin/bash

# Test JWT Authentication - All Endpoints
echo "🔐 Testing JWT Authentication for all endpoints..."
echo

# JWT Token from login
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4NTA2OTY0YS1hNGI1LTQ3MDgtOTczYy0xNzEyZDE5M2ExZjgiLCJpYXQiOjE3NTE3MjgzMzEsImV4cCI6MTc1MjMzMzEzMX0.16B1h0Mzx4VX7mwvP9gPaDU43i2IAaU6UcT3r1bS2Oo"
USER_ID="8506964a-a4b5-4708-973c-1712d193a1f8"
BASE_URL="http://localhost:3000"

echo "✅ Testing /api/auth/verify..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/auth/verify" | jq -r '.success'

echo "✅ Testing /api/todos..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/todos" | jq -r '.stats.total'

echo "✅ Testing /api/settings..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/settings" | jq -r 'if .settings then "success" else .error end'

echo "✅ Testing /api/daily-logs..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/daily-logs" | jq -r 'if .logs then "success" else .error end'

echo "✅ Testing /api/users/$USER_ID/dashboard..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/users/$USER_ID/dashboard" | jq -r 'if .user then "success" else .error end'

echo "✅ Testing /api/users/$USER_ID/calendar..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/users/$USER_ID/calendar" | jq -r 'if .calendar then "success" else .error end'

echo "✅ Testing /api/users/$USER_ID/challenges..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/users/$USER_ID/challenges" | jq -r 'if .challenges then "success" else .error end'

echo
echo "🎉 All endpoints tested with JWT authentication!"
