#!/bin/bash

echo "Testing notification timer persistence and delivery..."

# Wait for server to be ready
sleep 2

# Test the immediate notification endpoint
echo "Testing immediate notification creation..."
curl -X POST "http://localhost:3003/api/test/notifications/immediate?type=log" \
  -H "Authorization: Bearer your-test-token" \
  -H "Content-Type: application/json" 2>/dev/null | jq '.' || echo "Test endpoint call completed"

echo ""
echo "To test timer persistence:"
echo "1. Go to http://localhost:3003"
echo "2. Login to your account"
echo "3. Go to Settings > Notifications"
echo "4. Change the Daily Log Reminder time"
echo "5. Wait for auto-save confirmation"
echo "6. Navigate to another page (e.g., Calendar)"
echo "7. Return to Settings > Notifications"
echo "8. Verify the time is still set correctly"
echo "9. Click 'Test Notification' to send an immediate notification"
echo ""
echo "To test notification scheduling:"
echo "1. Set a reminder time 1-2 minutes in the future"
echo "2. Wait and watch for notifications"
echo "3. Check the notification bell icon"
echo ""
echo "The notification scheduler has been updated to:"
echo "- Send reminders at or after the scheduled time (not just within 5 minutes)"
echo "- Handle delayed cron jobs better"
echo "- Prevent duplicate notifications"
echo ""
echo "Settings now auto-save with debouncing to prevent timer resets."
