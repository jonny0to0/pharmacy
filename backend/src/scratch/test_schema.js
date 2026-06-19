import { supplierSchema } from "../validators/schemas.js";
const req = {
    body: {
        name: "Test Vendor",
        type: "PHARMA",
        mobile: "9876543210",
        email: "test@vendor.com",
        gstin: "27AAAAA0000A1Z5",
        drugLicenseNo: "20B/21B-XXXXX",
        dlExpiry: "2026-05-12",
        pan: "ABCDE1234F",
        address: "Some address",
        state: "Delhi"
    }
};
try {
    const validated = supplierSchema.parse(req);
    console.log("Passed:", validated);
}
catch (error) {
    console.error("Zod Error:", error);
}
//# sourceMappingURL=test_schema.js.map