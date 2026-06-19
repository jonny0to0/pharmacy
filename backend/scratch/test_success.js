import axios from 'axios';
async function testSuccess() {
    const url = 'http://localhost:5000/api/v1/auth/register';
    const data = {
        name: 'Success User',
        email: 'final_success_endpoint_v4@example.com',
        mobile: '1234567801',
        password: 'Password123!',
        businessName: 'Success Pharma'
    };
    try {
        console.log('Testing successful registration...');
        const response = await axios.post(url, data);
        console.log('Status:', response.status);
        console.log('Data:', response.data.message);
        console.log('User:', response.data.user.name);
    }
    catch (error) {
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        }
        else {
            console.error('Error:', error.message);
        }
    }
}
testSuccess();
//# sourceMappingURL=test_success.js.map