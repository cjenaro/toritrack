import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { prisma } from "~/utils/db.server";
import { UniqueEnforcer } from "enforce-unique";

export async function cleanupDb(): Promise<void> {
  const tables = await prisma.$queryRaw<{ name: string }[]>`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_migrations';
  `;

  try {
    await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = OFF`);
    await prisma.$transaction(
      tables.map(({ name }) =>
        prisma.$executeRawUnsafe(`DELETE FROM "${name}"`),
      ),
    );
  } catch (error) {
    console.error("Error cleaning up database:", error);
  } finally {
    await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = ON`);
  }
}

const uniqueUsernameEnforcer = new UniqueEnforcer();

type User = {
  name: string;
  email: string;
};

function createUser(): User {
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

function createPassword(password: string): { hash: string } {
  return { hash: bcrypt.hashSync(password, 10) };
}

type ExpenseCategory = "suppliers" | "rent" | "salaries";
function createExpenseCategory(name: ExpenseCategory): { name: string } {
  return { name };
}

type StockType = "beef" | "pork" | "chicken";
function createStockType(name: StockType): { name: string } {
  return { name };
}

function createExpense(categoryId: number) {
  return {
    categoryId,
    amount: faker.number.float({ min: 100, max: 1000 }),
    date: faker.date.soon({ days: 40 }),
    description: faker.company.name(),
  };
}

function createSale(clientId: number | null = null): {
  type: string;
  amount: number;
  clientId: number | null;
} {
  return {
    type: faker.helpers.arrayElement([
      "cash",
      "card",
      "transfer",
      "current account",
    ]),
    amount: faker.number.float({ min: 50, max: 1000 }),
    clientId,
  };
}

function createClient(): {
  name: string;
  discount: number;
} {
  return {
    name: faker.company.name(),
    discount: faker.number.float({ min: 0.05, max: 0.3 }),
  };
}

function createStock(typeId: number): {
  typeId: number;
  quantity: number;
  costValue: number;
} {
  return {
    typeId,
    quantity: faker.number.int({ min: 1, max: 500 }),
    costValue: faker.number.float({ min: 100, max: 10000 }),
  };
}

async function seed(): Promise<void> {
  console.log("🌱 Seeding...");
  console.time(`🌱 Database has been seeded`);

  console.time("🧹 Cleaned up the database...");
  await cleanupDb();
  console.timeEnd("🧹 Cleaned up the database...");

  // Seed Users
  console.time("👤 Seeded users...");
  // Create random users
  await prisma.$transaction(
    Array.from({ length: 3 }).map(() =>
      prisma.user.create({
        data: {
          ...createUser(),
          password: {
            create: createPassword(faker.internet.password()),
          },
        },
      }),
    ),
  );

  // Create admin user
  await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@hey.com",
      password: {
        create: createPassword("admin123"),
      },
    },
  });
  console.timeEnd("👤 Seeded users...");

  // Seed Expense Categories
  console.time("💸 Seeded expense categories...");
  const expenseCategories = await prisma.$transaction(
    ["suppliers", "rent", "salaries"].map((name) =>
      prisma.expenseCategory.create({
        data: createExpenseCategory(name as ExpenseCategory),
      }),
    ),
  );
  console.timeEnd("💸 Seeded expense categories...");

  // Seed Stock Types
  console.time("📦 Seeded stock types...");
  const stockTypes = await prisma.$transaction(
    ["beef", "pork", "chicken"].map((name) =>
      prisma.stockType.create({ data: createStockType(name as StockType) }),
    ),
  );
  console.timeEnd("📦 Seeded stock types...");

  // Seed Clients
  console.time("👤 Seeded clients...");
  const clients = await prisma.$transaction(
    Array.from({ length: 3 }).map(() =>
      prisma.client.create({ data: createClient() }),
    ),
  );
  console.timeEnd("👤 Seeded clients...");

  // Seed Expenses
  console.time("💵 Seeded expenses...");
  await prisma.$transaction(
    expenseCategories.flatMap((category) =>
      prisma.expense.create({
        data: createExpense(category.id),
      }),
    ),
  );
  console.timeEnd("💵 Seeded expenses...");

  // Seed Sales
  console.time("🛒 Seeded sales...");
  await prisma.$transaction(
    Array.from({ length: 5 }).map(() =>
      prisma.sale.create({ data: createSale() }),
    ),
  );
  console.timeEnd("🛒 Seeded sales...");

  // Seed Client Sales
  console.time("🛒 Seeded client sales...");
  await prisma.$transaction(
    clients.flatMap((client) =>
      prisma.sale.create({ data: createSale(client.id) }),
    ),
  );
  console.timeEnd("🛒 Seeded client sales...");

  // Seed Stocks
  console.time("📦 Seeded stocks...");
  await prisma.$transaction(
    stockTypes.flatMap((type) =>
      prisma.stock.create({
        data: createStock(type.id),
      }),
    ),
  );
  console.timeEnd("📦 Seeded stocks...");

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
