const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('--- Bolt: Analytics Optimization Verification ---');

  try {
    const results = await prisma.$queryRaw`
      SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE url LIKE '%sahibinden.com%')::int as sahibinden,
        COUNT(*) FILTER (WHERE url LIKE '%hepsiemlak.com%' OR url LIKE '%hemlak.com%')::int as hepsiemlak,
        COUNT(*) FILTER (WHERE url LIKE '%emlakjet.com%')::int as emlakjet,
        COUNT(*) FILTER (WHERE assigned_user_id IS NOT NULL)::int as assigned
      FROM "properties"
    `;
    console.log('SQL Verification Successful.');
    console.log('Results:', results[0]);
  } catch (error) {
    console.error('SQL Verification Failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
