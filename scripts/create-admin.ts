/**
 * Create (or reset) a Super Admin from the command line.
 *
 *   npm run create-admin -- --email you@college.in --name "Your Name"
 *
 * You'll be asked for a password (min. 10 characters). Set ADMIN_PASSWORD to
 * skip the prompt in CI.
 */
import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const email = (arg("email") ?? (await rl.question("Email: "))).toLowerCase().trim();
    const name = arg("name") ?? ((await rl.question("Full name: ")) || "Super Admin");
    const password = process.env.ADMIN_PASSWORD ?? (await rl.question("Password (min 10 chars): "));
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Please enter a valid email.");
    if (password.length < 10) throw new Error("Password must be at least 10 characters.");

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: "SUPER_ADMIN", active: true, name },
      create: { email, name, passwordHash, role: "SUPER_ADMIN" },
    });
    console.log(`✓ Super admin ready: ${user.email}`);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(`✗ ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
