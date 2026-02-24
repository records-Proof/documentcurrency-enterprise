require("dotenv").config();
const path = require("path");

module.exports = {
  schema: path.join(process.cwd(), "../../infra/prisma/schema.prisma"),
  datasourceUrl: process.env.DATABASE_URL,
};
