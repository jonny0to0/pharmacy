import prisma from '../db.js';
import bcrypt from 'bcryptjs';
async function main() {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    await prisma.user.update({
        where: { email: 'admin@medisynex.com' },
        data: { password: hashedPassword }
    });
    console.log('Admin password reset to admin123');
}
main()
    .catch((err) => {
    console.error(err);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=reset-admin.js.map