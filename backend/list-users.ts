import prisma from "./src/db.js";

async function main() {
  const users = await prisma.user.findMany({
    include: {
      userrole: {
        include: {
          role: true
        }
      }
    }
  });
  console.log("Registered Users:");
  users.forEach(u => {
    console.log(`- Name: ${u.name}, Email: ${u.email}, Roles: ${u.userrole.map(ur => ur.role.name).join(", ")}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
