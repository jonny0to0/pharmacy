import axios from 'axios';
async function testBatchSetup() {
    const url = 'http://localhost:5000/api/v1/setup/complete-batch';
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwMzg1NTEwOC04NjY2LTRlN2YtODBmNS00MGMwYmI0ZDgyNGEiLCJ0ZW5hbnRJZCI6IjBmZjMyMjA4LTk5MWQtNDM4Mi05YTkzLTI4ODg1ZGZlOWQxMyIsInJvbGVzIjpbIkJVU0lORVNTX0FETUlOIl0sImlzSW1wZXJzb25hdGluZyI6dHJ1ZSwiaWF0IjoxNzc2Nzk2MzIzLCJleHAiOjE3NzY3OTk5MjN9.m5-j9dXFhHvNMs1vWiIXEEBPVH7DVuWRG22tQyfdlCI';
    const data = {
        businessType: 'RETAILER',
        businessInfo: {
            name: 'Medisynex Success Pharma',
            owner: 'Success User',
            mobile: '1234567801',
            email: 'final_success_endpoint_v4@example.com'
        },
        compliance: {
            pan: 'ABCDE1234F',
            gst: '27ABCDE1234F1Z5',
            drugLicense: 'DL-123456',
            fssai: '12345678901234'
        },
        address: {
            line1: '123 Success Street',
            line2: 'Suite 100',
            state: 'Maharashtra',
            pincode: '400001'
        },
        billing: {
            currency: 'INR',
            invoicePrefix: 'MED-',
            paymentMethods: ['CASH', 'UPI', 'CARD'],
            creditLimit: true,
            autoGst: true
        },
        users: {
            password: 'NewPassword123!',
            staff: [
                { name: 'Staff Member 1', role: 'PHARMACIST' }
            ]
        }
    };
    try {
        console.log('Testing batch setup...');
        const response = await axios.post(url, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Status:', response.status);
        console.log('Response:', response.data);
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
testBatchSetup();
//# sourceMappingURL=test_batch_setup.js.map