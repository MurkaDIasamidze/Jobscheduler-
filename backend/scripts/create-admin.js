const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createAdmin() {
  const email = process.env.ADMIN_USERNAME || "testAdmin@example.com";
  const password = process.env.ADMIN_PASSWORD || "admin1234";

  await prisma.user.deleteMany({ where: { email } });
  const hashed = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: { email, password: hashed, name: "Admin", role: "admin" },
  });

  console.log("✅ Admin created:", { id: admin.id, email: admin.email, role: admin.role });
  await prisma.$disconnect();
}

createAdmin().catch(e => { console.error("❌", e); prisma.$disconnect(); });
