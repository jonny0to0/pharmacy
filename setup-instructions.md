# Medisynex Setup Instructions

Follow these steps to run the Medisynex Pharmacy Billing system locally.

## Prerequisite
- Node.js (v18+)
- MySQL Server (e.g., via XAMPP) running on `localhost:3306`

## 1. Database Setup
1. Open your XAMPP Control Panel.
2. Start the **MySQL** service.
3. Keep the default username `root` and empty password.

## 2. Backend Initialization
1. Open your terminal and navigate to the `backend` folder:
   ```bash
   cd c:/xampp/htdocs/pharmacy_billing/backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Prisma Migration. This will auto-create all tables in MySQL:
   ```bash
   npx prisma migrate dev --name init_schema
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will run on `http://localhost:5000`.*

## 3. Frontend Initialization
1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd c:/xampp/htdocs/pharmacy_billing/frontend
   ```
2. Install all frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The app will run on `http://localhost:5173`.*

You can now navigate to `http://localhost:5173` in your browser to access the Medisynex UI!
