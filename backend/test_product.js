import prisma from './src/db.js';
async function run() { try {
    await prisma.product.create({ data: { name: 'Test', sku: '123', unit: 'pcs', tenantId: '123' } });
}
catch (e) {
    console.error(e);
} }
run();
//# sourceMappingURL=test_product.js.map