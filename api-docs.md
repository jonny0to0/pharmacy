# Medisynex API Documentation

## Authentication (`/api/v1/auth`)

### `POST /register`
Registers a new user (admin or staff).
**Body:**
```json
{
  "name": "Admin",
  "email": "admin@medisynex.app",
  "mobile": "9876543210",
  "password": "securepassword",
  "role": "ADMIN"
}
```

### `POST /login`
Authenticates a user and returns a JWT token.
**Body:**
```json
{
  "mobile": "9876543210", 
  "password": "securepassword"
}
```

---

## Products (`/api/v1/products`)
*Requires `Authorization: Bearer <token>`*

### `GET /`
Returns a list of all products in inventory.

### `POST /`
Creates a new product/medicine.
**Body:**
```json
{
  "name": "Paracetamol 500mg",
  "sku": "MED-001",
  "category": "Tablets",
  "hsnCode": "3004",
  "unit": "Strip",
  "purchasePrice": 10.50,
  "sellingPrice": 15.00,
  "mrp": 18.00,
  "gstRate": 12,
  "minStockLevel": 50,
  "currentStock": 200,
  "location": "A-1"
}
```

### `GET /low-stock`
Returns products where `currentStock` is less than `minStockLevel`.

---

## Customers & Suppliers (`/api/v1/customers` & `/api/v1/suppliers`)
*Requires `Authorization: Bearer <token>`*

### `GET /`
Returns a list of all parties including their outstanding balances.

### `POST /`
Create a new customer or supplier profile.
**Body:**
```json
{
  "name": "Sharma Clinics",
  "mobile": "9998887776",
  "email": "contact@sharma.com",
  "gstin": "27AADCS123X1Z2",
  "address": "MG Road",
  "state": "Maharashtra"
}
```

---

## Sales POS (`/api/v1/sales`)
*Requires `Authorization: Bearer <token>`*

### `GET /`
Fetches all recent sales invoices.

### `POST /`
Registers a new POS Sale Invoice. Automatically deducts product stock and updates customer ledger (if credit).
**Body:**
```json
{
  "invoiceNumber": "INV-2026-001",
  "customerId": "uuid-here",
  "type": "TAX_INVOICE",
  "subTotal": 1000.0,
  "totalTax": 120.0,
  "discount": 50.0,
  "grandTotal": 1070.0,
  "amountPaid": 1070.0,
  "isCash": true,
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 10,
      "rate": 100.0,
      "gstRate": 12,
      "taxableAmount": 1000.0,
      "total": 1120.0
    }
  ]
}
```

---

## Purchases (`/api/v1/purchases`)
*Requires `Authorization: Bearer <token>`*

### `GET /`
Fetches all record of inwards supplies (Purchases).

### `POST /`
Registers a new Vendor/Supplier Purchase Bill. Automatically increments inventory stock.
**Body:**
```json
{
  "billNumber": "PB-2026-001",
  "supplierInvoiceNo": "VEND/256",
  "supplierId": "uuid-here",
  "subTotal": 5000.0,
  "totalTax": 600.0,
  "grandTotal": 5600.0,
  "amountPaid": 5000.0,
  "items": [...] 
}
```
