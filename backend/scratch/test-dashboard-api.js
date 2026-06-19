import axios from 'axios';
const API_URL = 'http://localhost:5000/api/v1';
async function test() {
    try {
        console.log("Logging in...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'medisynex@gmail.com',
            password: 'password123' // Common default in these tasks
        });
        const token = loginRes.data.accessToken;
        console.log("Login success. Token obtained.");
        console.log("Fetching dashboard...");
        const dashboardRes = await axios.get(`${API_URL}/reports/dashboard`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Dashboard data:", JSON.stringify(dashboardRes.data, null, 2));
    }
    catch (err) {
        if (err.response) {
            console.error("API Error:", err.response.status, err.response.data);
        }
        else {
            console.error("Network Error:", err.message);
        }
    }
}
test();
//# sourceMappingURL=test-dashboard-api.js.map