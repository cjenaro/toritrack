import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "~/utils/db.server";
import { UniqueEnforcer } from "enforce-unique";

export async function cleanupDb(prisma: PrismaClient) {
  const tables = await prisma.$queryRaw<
    { name: string }[]
  >`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_migrations';`;

  try {
    // Disable FK constraints to avoid relation conflicts during deletion
    await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = OFF`);
    await prisma.$transaction([
      // Delete all rows from each table, preserving table structures
      ...tables.map(({ name }) =>
        prisma.$executeRawUnsafe(`DELETE from "${name}"`),
      ),
    ]);
  } catch (error) {
    console.error("Error cleaning up database:", error);
  } finally {
    await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = ON`);
  }
}

const uniqueUsernameEnforcer = new UniqueEnforcer();
function createUser() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  const username = uniqueUsernameEnforcer
    .enforce(() => {
      return (
        faker.string.alphanumeric({ length: 2 }) +
        "_" +
        faker.internet.username({
          firstName: firstName.toLowerCase(),
          lastName: lastName.toLowerCase(),
        })
      );
    })
    .slice(0, 20)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");
  return {
    name: `${firstName} ${lastName}`,
    email: `${username}@example.com`,
  };
}

function createPassword(password: string) {
  return { hash: bcrypt.hashSync(password, 10) };
}

async function seed() {
  console.log("🌱 Seeding...");
  console.time(`🌱 Database has been seeded`);

  console.time("🧹 Cleaned up the database...");
  await cleanupDb(prisma);
  console.timeEnd("🧹 Cleaned up the database...");

  const totalUsers = 5;

  console.time(`👤 Created ${totalUsers} users...`);
  for (let i = 0; i < totalUsers; i++) {
    const userData = createUser();

    await prisma.user
      .create({
        data: {
          ...userData,
          password: {
            create: createPassword(userData.email),
          },
          sessions: {
            create: Array.from({
              length: faker.number.int({ min: 1, max: 3 }),
            }).map(() => ({
              expirationDate: faker.date.future(),
            })),
          },
        },
      })
      .catch((e) => {
        console.error("Error creating a user:", e);
        return null;
      });
  }
  console.timeEnd(`👤 Created ${totalUsers} users...`);

  console.time(`Created user "admin"`);
  const userData = {
    email: "admin@hey.dev",
    name: "Admin",
  };

  await prisma.user
    .create({
      data: {
        ...userData,
        password: {
          create: createPassword("admin123"),
        },
      },
    })
    .catch((e) => {
      console.error("Error creating user:", e);
      return null;
    });
  console.timeEnd(`Created user "admin"`);

  console.timeEnd(`🌱 Database has been seeded`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
