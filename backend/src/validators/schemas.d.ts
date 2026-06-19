import { z } from "zod";
export declare const loginSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodOptional<z.ZodString>;
        mobile: z.ZodOptional<z.ZodString>;
        password: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const registerSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
        mobile: z.ZodString;
        password: z.ZodString;
        businessName: z.ZodString;
        role: z.ZodOptional<z.ZodEnum<{
            BUSINESS_ADMIN: "BUSINESS_ADMIN";
            SUPER_ADMIN: "SUPER_ADMIN";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const businessProfileSchema: z.ZodObject<{
    body: z.ZodObject<{
        businessName: z.ZodString;
        ownerName: z.ZodString;
        phone: z.ZodString;
        email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        address: z.ZodString;
        state: z.ZodString;
        pinCode: z.ZodString;
        businessType: z.ZodEnum<{
            PHARMACY: "PHARMACY";
            HOSPITAL: "HOSPITAL";
            WHOLESALER: "WHOLESALER";
            RETAILER: "RETAILER";
            DISTRIBUTOR: "DISTRIBUTOR";
            MEDICAL_STORE: "MEDICAL_STORE";
        }>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const taxSettingsSchema: z.ZodObject<{
    body: z.ZodObject<{
        gstNumber: z.ZodOptional<z.ZodString>;
        taxType: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const productSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        sku: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        barcode: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        category: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        hsnCode: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        unit: z.ZodDefault<z.ZodString>;
        manufacturer: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        gstRate: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
        minStockLevel: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
        currentStock: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
        purchasePrice: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
        sellingPrice: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
        mrp: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
        location: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        medicalDescription: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        uses: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        contraindications: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        sideEffects: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        precautions: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        dosageInfo: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const batchSchema: z.ZodObject<{
    batchNo: z.ZodString;
    mfgDate: z.ZodString;
    expiryDate: z.ZodString;
    quantity: z.ZodCoercedNumber<unknown>;
    purchasePrice: z.ZodCoercedNumber<unknown>;
    mrp: z.ZodCoercedNumber<unknown>;
    sellingPrice: z.ZodCoercedNumber<unknown>;
    supplierId: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, z.core.$strip>;
export declare const productWithBatchSchema: z.ZodObject<{
    body: z.ZodObject<{
        product: z.ZodObject<{
            name: z.ZodString;
            sku: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
            barcode: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
            category: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
            hsnCode: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
            unit: z.ZodDefault<z.ZodString>;
            manufacturer: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
            gstRate: z.ZodCoercedNumber<unknown>;
            minStockLevel: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
            location: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
            medicalDescription: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
            uses: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
            contraindications: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
            sideEffects: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
            precautions: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
            dosageInfo: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        }, z.core.$strip>;
        batches: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
            batchNo: z.ZodString;
            mfgDate: z.ZodString;
            expiryDate: z.ZodString;
            quantity: z.ZodCoercedNumber<unknown>;
            purchasePrice: z.ZodCoercedNumber<unknown>;
            mrp: z.ZodCoercedNumber<unknown>;
            sellingPrice: z.ZodCoercedNumber<unknown>;
            supplierId: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        }, z.core.$strip>>>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const customerSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        phone: z.ZodString;
        email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        gst_number: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        address: z.ZodOptional<z.ZodString>;
        state: z.ZodOptional<z.ZodString>;
        customerType: z.ZodDefault<z.ZodEnum<{
            regular: "regular";
            wholesale: "wholesale";
        }>>;
        creditLimit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
        creditDays: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        dob: z.ZodUnion<[z.ZodNullable<z.ZodOptional<z.ZodString>>, z.ZodLiteral<"">]>;
        gender: z.ZodUnion<[z.ZodNullable<z.ZodOptional<z.ZodString>>, z.ZodLiteral<"">]>;
        membershipType: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            Regular: "Regular";
            Premium: "Premium";
            Corporate: "Corporate";
        }>>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const expenseSchema: z.ZodObject<{
    body: z.ZodObject<{
        category: z.ZodString;
        amount: z.ZodCoercedNumber<unknown>;
        date: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodOptional<z.ZodDate>]>;
        description: z.ZodOptional<z.ZodString>;
        paymentMode: z.ZodOptional<z.ZodEnum<{
            CASH: "CASH";
            UPI: "UPI";
            CARD: "CARD";
            BANK_TRANSFER: "BANK_TRANSFER";
            CHEQUE: "CHEQUE";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const paymentSchema: z.ZodObject<{
    body: z.ZodObject<{
        customerId: z.ZodOptional<z.ZodString>;
        supplierId: z.ZodOptional<z.ZodString>;
        amount: z.ZodCoercedNumber<unknown>;
        mode: z.ZodOptional<z.ZodEnum<{
            CASH: "CASH";
            UPI: "UPI";
            CARD: "CARD";
            BANK_TRANSFER: "BANK_TRANSFER";
            CHEQUE: "CHEQUE";
        }>>;
        referenceNo: z.ZodOptional<z.ZodString>;
        saleInvoiceId: z.ZodOptional<z.ZodString>;
        purchaseBillId: z.ZodOptional<z.ZodString>;
        date: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodOptional<z.ZodDate>]>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const supplierSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        type: z.ZodDefault<z.ZodEnum<{
            PHARMA: "PHARMA";
            NON_PHARMA: "NON_PHARMA";
        }>>;
        mobile: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        gstin: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        drugLicenseNo: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        dlExpiry: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        pan: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        address: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        state: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=schemas.d.ts.map