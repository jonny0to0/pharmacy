
import { basePrisma } from '../src/db.ts';

async function main() {
  try {
    console.log('--- Roles ---');
    const roles = await basePrisma.role.findMany();
    console.log(JSON.stringify(roles, null, 2));

    console.log('\n--- Plans ---');
    const plans = await basePrisma.plan.findMany({
      include: { planfeature: true, planlimit: true }
    });
    console.log(JSON.stringify(plans, null, 2));

    console.log('\n--- Users ---');
    const users = await basePrisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error during DB check:', err);
  } finally {
    await basePrisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
