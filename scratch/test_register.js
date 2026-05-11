
async function testRegister() {
  try {
    const response = await fetch('http://localhost:5000/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User ' + Date.now(),
        email: 'test' + Date.now() + '@example.com',
        mobile: '9' + Math.floor(Math.random() * 900000000) + '0',
        password: 'Password123',
        businessName: 'Test Business ' + Date.now(),
        role: 'BUSINESS_ADMIN'
      })
    });
    const data = await response.json();
    console.log('Registration Response Status:', response.status);
    console.log('Registration Response Body:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRegister();
