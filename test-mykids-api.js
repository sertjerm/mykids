// test-mykids-api.js
// Node.js script สำหรับทดสอบ API

const API_URL = 'https://apps4.coop.ku.ac.th/mykids/api';

async function testApi() {
  console.log('🔍 ทดสอบ MyKids API...');
  console.log('API URL:', API_URL);
  
  try {
    const response = await fetch(API_URL + '?health');
    const data = await response.json();
    
    console.log('✅ API เชื่อมต่อสำเร็จ');
    console.log('Response:', data);
  } catch (error) {
    console.log('❌ API เชื่อมต่อไม่ได้:', error.message);
  }
}

testApi();
