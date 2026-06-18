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

  // Custom role 'ACCOUNTANT' id is: 2424a1a8-792c-4a72-9e84-1057fe60cd1d
  const payload = {
    name: "ACCOUNTANT_UPDATED",
    description: "Updated description for test accountant role"
  };

  try {
    console.log("Sending PUT request to update custom role details...");
    const response = await fetch(
      'http://localhost:5000/api/v1/roles/2424a1a8-792c-4a72-9e84-1057fe60cd1d',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      }
    );
    
    console.log("Status Code:", response.status);
    const data = await response.json();
    console.log("Response Data:", data);

    // Let's restore the name back to ACCOUNTANT for subsequent tests
    console.log("\nRestoring custom role details back to ACCOUNTANT...");
    const restoreResponse = await fetch(
      'http://localhost:5000/api/v1/roles/2424a1a8-792c-4a72-9e84-1057fe60cd1d',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: "ACCOUNTANT",
          description: "Manage branch accounting and billing accounts"
        })
      }
    );
    console.log("Restore Status Code:", restoreResponse.status);
  } catch (error: any) {
    console.error("Error sending request:", error);
  }
}

main();
