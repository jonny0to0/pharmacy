// Test Customer API

const API_URL = "http://localhost:5000/api/customers";
let token = ""; // Need token to test

async function testCRUD() {
  try {
    // 0. Register user
    await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Admin", email: "admin@medisynex.com", mobile: "9999999999", password: "password123", role: "ADMIN" })
    });

    // 1. Get token
    const loginRes = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@medisynex.com", password: "password123" }) // Ensure this fits DB
    });
    
    if(!loginRes.ok) {
        console.log("Could not login. Registration might be needed.");
        return;
    }
    const loginData = await loginRes.json();
    token = loginData.token;
    console.log("Logged in:", token.substring(0,20) + "...");

    // Create
    const createRes = await fetch(API_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        name: "John Doe Test",
        phone: "9876543210",
        customerType: "regular",
        creditLimit: 5000
      })
    });
    const createdData = await createRes.json();
    console.log("Create Response:", createRes.status, createdData);
    let id = createdData?.data?.id;

    if (id) {
       // GET
       const getRes = await fetch(API_URL, {
          headers: { "Authorization": `Bearer ${token}` }
       });
       const getList = await getRes.json();
       console.log("Get Response count:", getList.length);

       // Update
       const updateRes = await fetch(`${API_URL}/${id}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            name: "John Doe Test Updated",
            phone: "9876543210",
            customerType: "wholesale",
            creditLimit: 15000
          })
       });
       const updatedData = await updateRes.json();
       console.log("Update Response:", updateRes.status, updatedData);

       // Delete
       const delRes = await fetch(`${API_URL}/${id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
       });
       const delData = await delRes.json();
       console.log("Delete Response:", delRes.status, delData);
    }
  } catch (e) {
    console.error("Test failed", e);
  }
}

testCRUD();
