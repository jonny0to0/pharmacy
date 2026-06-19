import { z } from "zod";
export const loginSchema = z.object({
    body: z.object({
        email: z.string().email().optional(),
        mobile: z.string().optional(),
        password: z.string().min(6)
    }).refine(data => data.email || data.mobile, {
        message: "Either email or mobile is required",
        path: ["body"]
    })
});
export const registerSchema = z.object({
    body: z.object({
        name: z.string().min(2),
        email: z.string().email(),
        mobile: z.string().min(10),
        password: z.string().min(6),
        businessName: z.string().min(2),
        role: z.enum(["SUPER_ADMIN", "BUSINESS_ADMIN"]).optional()
    })
});
export const businessProfileSchema = z.object({
    body: z.object({
        businessName: z.string().min(2),
        ownerName: z.string().min(2),
        phone: z.string().min(10),
        email: z.string().email().optional().or(z.literal("")),
        address: z.string().min(5),
        state: z.string().min(2),
        pinCode: z.string().min(6),
        businessType: z.enum(["PHARMACY", "HOSPITAL", "WHOLESALER", "RETAILER", "DISTRIBUTOR", "MEDICAL_STORE"])
    })
});
export const taxSettingsSchema = z.object({
    body: z.object({
        gstNumber: z.string().optional(),
        taxType: z.string().default("GST")
    })
});
export const productSchema = z.object({
    body: z.object({
        name: z.string().min(2),
        sku: z.string().optional().or(z.literal("")),
        barcode: z.string().optional().or(z.literal("")),
        category: z.string().optional().or(z.literal("")),
        hsnCode: z.string().optional().or(z.literal("")),
        unit: z.string().default("Tablet"),
        manufacturer: z.string().optional().or(z.literal("")),
        gstRate: z.coerce.number().min(0).max(28).default(0),
        minStockLevel: z.coerce.number().min(0).default(10),
        currentStock: z.coerce.number().min(0).default(0),
        purchasePrice: z.coerce.number().min(0).default(0),
        sellingPrice: z.coerce.number().min(0).default(0),
        mrp: z.coerce.number().min(0).default(0),
        location: z.string().optional().or(z.literal("")),
        medicalDescription: z.string().optional().or(z.literal("")),
        uses: z.string().optional().or(z.literal("")),
        contraindications: z.string().optional().or(z.literal("")),
        sideEffects: z.string().optional().or(z.literal("")),
        precautions: z.string().optional().or(z.literal("")),
        dosageInfo: z.string().optional().or(z.literal(""))
    })
});
export const batchSchema = z.object({
    batchNo: z.string().min(1, "Batch Number is required"),
    mfgDate: z.string().min(1, "Manufacture date is required"),
    expiryDate: z.string().min(1, "Expiry date is required"),
    quantity: z.coerce.number().positive("Quantity must be greater than 0"),
    purchasePrice: z.coerce.number().min(0),
    mrp: z.coerce.number().min(0),
    sellingPrice: z.coerce.number().min(0),
    supplierId: z.string().uuid().optional().or(z.literal(""))
}).refine(data => {
    const mfg = new Date(data.mfgDate);
    const exp = new Date(data.expiryDate);
    return mfg < exp;
}, {
    message: "Manufacture date must be before expiry date",
    path: ["mfgDate"]
}).refine(data => {
    return data.sellingPrice <= data.mrp;
}, {
    message: "Selling price cannot exceed MRP",
    path: ["sellingPrice"]
}).refine(data => {
    const exp = new Date(data.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return exp > today;
}, {
    message: "Cannot add expired batch",
    path: ["expiryDate"]
});
export const productWithBatchSchema = z.object({
    body: z.object({
        product: z.object({
            name: z.string().min(2),
            sku: z.string().optional().or(z.literal("")),
            barcode: z.string().optional().or(z.literal("")),
            category: z.string().optional().or(z.literal("")),
            hsnCode: z.string().optional().or(z.literal("")),
            unit: z.string().default("Tablet"),
            manufacturer: z.string().optional().or(z.literal("")),
            gstRate: z.coerce.number().min(0).max(28),
            minStockLevel: z.coerce.number().min(0).default(10),
            location: z.string().optional().or(z.literal("")),
            medicalDescription: z.string().optional().or(z.literal("")),
            uses: z.string().optional().or(z.literal("")),
            contraindications: z.string().optional().or(z.literal("")),
            sideEffects: z.string().optional().or(z.literal("")),
            precautions: z.string().optional().or(z.literal("")),
            dosageInfo: z.string().optional().or(z.literal(""))
        }),
        batches: z.array(batchSchema).optional().default([])
    })
});
export const customerSchema = z.object({
    body: z.object({
        name: z.string().min(2),
        phone: z.string().min(10).max(15),
        email: z.string().email().optional().or(z.literal("")),
        gst_number: z.string().optional().or(z.literal("")),
        address: z.string().optional(),
        state: z.string().optional(),
        customerType: z.enum(["regular", "wholesale"]).default("regular"),
        creditLimit: z.coerce.number().min(0).default(0),
        creditDays: z.coerce.number().min(0).optional(),
        dob: z.string().optional().nullable().or(z.literal("")),
        gender: z.string().optional().nullable().or(z.literal("")),
        membershipType: z.enum(["Regular", "Premium", "Corporate"]).optional().default("Regular")
    })
});
export const expenseSchema = z.object({
    body: z.object({
        category: z.string().min(2),
        amount: z.coerce.number().positive(),
        date: z.string().datetime().optional().or(z.date().optional()),
        description: z.string().optional(),
        paymentMode: z.enum(["CASH", "UPI", "CARD", "BANK_TRANSFER", "CHEQUE"]).optional()
    })
});
export const paymentSchema = z.object({
    body: z.object({
        customerId: z.string().uuid().optional(),
        supplierId: z.string().uuid().optional(),
        amount: z.coerce.number().positive(),
        mode: z.enum(["CASH", "UPI", "CARD", "BANK_TRANSFER", "CHEQUE"]).optional(),
        referenceNo: z.string().optional(),
        saleInvoiceId: z.string().uuid().optional(),
        purchaseBillId: z.string().uuid().optional(),
        date: z.string().datetime().optional().or(z.date().optional())
    })
});
export const supplierSchema = z.object({
    body: z.object({
        name: z.string().min(2),
        type: z.enum(["PHARMA", "NON_PHARMA"]).default("PHARMA"),
        mobile: z.string().min(10).max(15).optional().or(z.literal("")),
        email: z.string().email().optional().or(z.literal("")),
        gstin: z.string().optional().or(z.literal("")),
        drugLicenseNo: z.string().optional().or(z.literal("")),
        dlExpiry: z.string().optional().or(z.literal("")),
        pan: z.string().optional().or(z.literal("")),
        address: z.string().optional().or(z.literal("")),
        state: z.string().optional().or(z.literal(""))
    }).refine(data => {
        if (data.type === "PHARMA" && !data.drugLicenseNo) {
            return false;
        }
        return true;
    }, {
        message: "Drug License Number is required for Pharma suppliers",
        path: ["drugLicenseNo"]
    })
});
//# sourceMappingURL=schemas.js.map