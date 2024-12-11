/*
  Warnings:

  - You are about to drop the `Month` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `monthId` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `weekStart` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `monthId` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `monthId` on the `Stock` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Month_startDate_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Month";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Expense" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categoryId" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Expense" ("amount", "categoryId", "createdAt", "description", "id") SELECT "amount", "categoryId", "createdAt", "description", "id" FROM "Expense";
DROP TABLE "Expense";
ALTER TABLE "new_Expense" RENAME TO "Expense";
CREATE TABLE "new_Sale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME,
    "clientId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sale_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("amount", "clientId", "createdAt", "id", "type") SELECT "amount", "clientId", "createdAt", "id", "type" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
CREATE TABLE "new_Stock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "typeId" INTEGER NOT NULL,
    "quantity" REAL NOT NULL,
    "costValue" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Stock_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "StockType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Stock" ("costValue", "createdAt", "id", "quantity", "typeId") SELECT "costValue", "createdAt", "id", "quantity", "typeId" FROM "Stock";
DROP TABLE "Stock";
ALTER TABLE "new_Stock" RENAME TO "Stock";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
