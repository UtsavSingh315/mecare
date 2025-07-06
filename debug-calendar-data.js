// Test to see what calendar data looks like
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { userId: 'b3a66049-8cca-42c4-b1b2-24b629e9423e' }, 
  'your-very-secure-jwt-secret-key-change-this-in-production-make-it-long-and-random',
  { expiresIn: '24h' }
);

async function checkCalendarData() {
  try {
    const response = await fetch('http://localhost:3000/api/users/b3a66049-8cca-42c4-b1b2-24b629e9423e/calendar?year=2025&month=7', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Calendar API Response:');
    console.log('================');
    console.log('Logs with period status:');
    data.logs.forEach(log => {
      console.log(`${log.date}: isOnPeriod=${log.isOnPeriod}`);
    });
    console.log('================');
    console.log('Period Days:');
    data.periodDays.forEach(period => {
      console.log(`${period.date}: flow=${period.flowIntensity}`);
    });
    console.log('================');
    
    // Test the logic manually
    const logMap = new Map(data.logs.map(log => [log.date, log]));
    const periodMap = new Map(data.periodDays.map(period => [period.date, period]));
    
    console.log('Testing isPeriodDay logic:');
    ['2025-07-05', '2025-07-06', '2025-07-07', '2025-07-08'].forEach(date => {
      const log = logMap.get(date);
      const periodData = periodMap.get(date);
      const isOnPeriod = log?.isOnPeriod === true;
      const hasPeriodData = !!periodData;
      const shouldBePeriodDay = isOnPeriod && hasPeriodData;
      
      console.log(`${date}: log.isOnPeriod=${isOnPeriod}, hasPeriodData=${hasPeriodData}, shouldBePeriodDay=${shouldBePeriodDay}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkCalendarData();
