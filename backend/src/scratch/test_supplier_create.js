import prisma from "../db.js";
import { supplierSchema } from "../validators/schemas.js";
import { randomUUID } from "crypto";
async function test() {
    try {
        // 1. Get a valid tenantId
        const tenant = await prisma.tenant.findFirst();
        if (!tenant) {
            console.log("No tenant found");
            return;
        }
        const tenantId = tenant.id;
        // 2. Validate input
        const req = {
            body: {
                name: "Test Vendor 123",
                type: "PHARMA",
                mobile: "9876543211",
                email: "test1234@vendor.com",
                gstin: "27AAAAA0000A1Z5",
                drugLicenseNo: "20B/21B-XXXXX",
                dlExpiry: "2026-05-12",
                pan: "ABCDE1234F",
                address: "Some address",
                state: "Delhi"
            }
        };
        const validated = supplierSchema.parse(req);
        const { name, type, mobile, email, gstin, drugLicenseNo, dlExpiry, pan, address, state } = validated.body;
        const normalize = (val) => {
            if (typeof val === 'string') {
                const trimmed = val.trim();
                return trimmed === "" ? null : trimmed;
            }
            return val || null;
        };
        const safeDate = (val) => {
            if (!val || val === "")
                return null;
            const date = new Date(val);
            return isNaN(date.getTime()) ? null : date;
        };
        const sanitizedMobile = normalize(mobile);
        const sanitizedEmail = normalize(email);
        // 3. Create supplier
        const newSupplier = await prisma.supplier.create({
            data: {
                id: randomUUID(),
                name: name.trim(),
                type: type,
                mobile: sanitizedMobile,
                email: sanitizedEmail,
                gstin: normalize(gstin),
                drugLicenseNo: normalize(drugLicenseNo),
                dlExpiry: safeDate(dlExpiry),
                pan: normalize(pan),
                address: normalize(address),
                state: normalize(state),
                outstandingBalance: 0,
                tenantId,
                updatedAt: new Date()
            }
        });
        console.log("Success:", newSupplier);
        // Clean up
        await prisma.supplier.delete({ where: { id: newSupplier.id } });
    }
    catch (err) {
        console.error("Error creating supplier:");
        console.error(err);
    }
    finally {
        await prisma.$disconnect();
    }
}
test();
//# sourceMappingURL=test_supplier_create.js.map