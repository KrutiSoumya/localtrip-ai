
console.log("LOADED DB FILE:", __filename);

require("dotenv").config();

const { PrismaClient, Prisma } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

console.log(
  "RUNTIME LEAD FIELDS:",
  Prisma.dmmf.datamodel.models
    .find((model) => model.name === "Lead")
    .fields.map((field) => field.name)
);

console.log(
  "RUNTIME BOOKING FIELDS:",
  Prisma.dmmf.datamodel.models
    .find((model) => model.name === "Booking")
    .fields.map((field) => field.name)
);

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
