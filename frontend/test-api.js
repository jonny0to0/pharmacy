fetch('http://localhost:5000/api/v1/health')
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);

fetch('http://localhost:5000/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
     name: "Admin User",
     email: `admin_live_${Date.now()}@medisynex.com`,
     mobile: `${Date.now()}`.slice(-10),
     password: "SecurePassword123",
     businessName: "Medisynex Live Pharmacy"
  })
}).then(async res => {
  console.log("Status:", res.status);
  console.log("Response:", await res.json());
}).catch(console.error);
