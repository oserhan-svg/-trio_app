const prisma = require('./db');

async function main() {
  const consultants = await prisma.user.count({ where: { role: 'consultant' } });
  const properties = await prisma.property.count();
  const interactions = await prisma.interaction.count();
  const clients = await prisma.client.count();
  const agendaItems = await prisma.agendaItem.count();

  console.log({
    consultants,
    properties,
    interactions,
    clients,
    agendaItems
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
