fetch('http://localhost:5000/api/v1/health')
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);

fetch('http://localhost:5000/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
     name: "Admin User",
     email: "admin2@medisynex.com",
     mobile: "9998887776",
     password: "SecurePassword123"
  })
}).then(async res => {
  console.log("Status:", res.status);
  console.log("Response:", await res.json());
}).catch(console.error);
