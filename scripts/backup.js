const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando respaldo de datos de Mayra Shop ---');
  
  const brands = await prisma.brand.findMany();
  const categories = await prisma.category.findMany();
  const products = await prisma.product.findMany();
  const settings = await prisma.setting.findMany();
  const orders = await prisma.order.findMany({ include: { items: true } });

  const backupData = {
    exportedAt: new Date().toISOString(),
    summary: {
      brandsCount: brands.length,
      categoriesCount: categories.length,
      productsCount: products.length,
      settingsCount: settings.length,
      ordersCount: orders.length,
    },
    brands,
    categories,
    products,
    settings,
    orders
  };

  const backupPath = path.join(__dirname, 'backup_mayrashop.json');
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');

  console.log('✅ Respaldo completado con éxito.');
  console.log(`📊 Resumen:`);
  console.log(`- Marcas: ${brands.length}`);
  console.log(`- Categorías: ${categories.length}`);
  console.log(`- Productos: ${products.length}`);
  console.log(`- Pedidos: ${orders.length}`);
  console.log(`📁 Guardado en: ${backupPath}`);
}

main()
  .catch((e) => {
    console.error('❌ Error al respaldar:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
