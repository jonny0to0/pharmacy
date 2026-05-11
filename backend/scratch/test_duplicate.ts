
import axios from 'axios';

async function testDuplicate() {
  const url = 'http://localhost:5000/api/v1/auth/register';
  const data = {
    name: 'Test User',
    email: 'final_test_success_v4@example.com', // Already registered
    mobile: '1234567897', // Already registered
    password: 'Password123!',
    businessName: 'Duplicate Pharma'
  };

  try {
    console.log('Testing duplicate registration...');
    const response = await axios.post(url, data);
    console.log('Response:', response.data);
  } catch (error: any) {
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testDuplicate();
