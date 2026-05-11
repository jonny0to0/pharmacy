
import prisma from "../src/db.ts";

async function test() {
  console.log("Querying modules...");
  try {
    const modules = await prisma.module.findMany();
    console.log("Modules found:", modules.length);
    console.log(modules);
  } catch (err) {
    console.error("Query error:", err);
  } finally {
    process.exit(0);
  }
}

test();
