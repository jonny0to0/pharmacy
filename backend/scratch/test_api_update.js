import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
async function main() {
    const user = {
        userId: '2b6bb38d-5978-4f9c-afda-975215e8c74b',
        tenantId: 'ec49384a-6f8f-41ab-bdc4-bdb8aac88a2f',
        roles: ['BUSINESS_ADMIN']
    };
    const token = jwt.sign(user, process.env.JWT_SECRET || 'default_secret', { expiresIn: '1h' });
    const payload = {
        name: "Nasiruddin",
        email: "nasiruddinsaikh2015@gmail.com",
        mobile: "222222222",
        role: "Accountant",
        branchIds: [],
        employeeId: "Nas221",
        department: "",
        designation: "",
        employmentType: "FULL_TIME",
        joinDate: "2026-06-04",
        salary: "",
        workShift: "",
        isActive: true
    };
    try {
        console.log("Sending PUT request with payload:", payload);
        const response = await fetch('http://localhost:5000/api/v1/users/staff/ef21411e-0424-4b56-a5cc-769f00cfc531', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        console.log("Status Code:", response.status);
        const data = await response.json();
        console.log("Response Data:", data);
    }
    catch (error) {
        console.error("Error sending request:", error);
    }
}
main();
//# sourceMappingURL=test_api_update.js.map