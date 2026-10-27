const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando restauración de Mayra Shop ---');

  const backupPath = path.join(__dirname, 'backup_mayrashop.json');
  if (!fs.existsSync(backupPath)) {
    throw new Error('Archivo de respaldo no encontrado: ' + backupPath);
  }

  const data = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
  console.log(`📦 Respaldo leído con ${data.products.length} productos, ${data.brands.length} marcas, ${data.categories.length} categorías.`);

  // 1. Restaurar Marcas
  console.log('1. Restaurando Marcas...');
  const brandIdMap = new Map();
  for (const b of data.brands) {
    const brand = await prisma.brand.upsert({
      where: { name: b.name },
      update: {},
      create: { name: b.name }
    });
    brandIdMap.set(b.id, brand.id);
  }
  console.log(`✅ ${brandIdMap.size} marcas aseguradas.`);

  // 2. Restaurar Categorías
  console.log('2. Restaurando Categorías...');
  const categoryIdMap = new Map();
  for (const c of data.categories) {
    const cat = await prisma.category.upsert({
      where: { name: c.name },
      update: {},
      create: { name: c.name }
    });
    categoryIdMap.set(c.id, cat.id);
  }
  console.log(`✅ ${categoryIdMap.size} categorías aseguradas.`);

  // 3. Restaurar Configuraciones (Settings)
  console.log('3. Restaurando Configuraciones...');
  for (const s of data.settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: String(s.value) },
      create: { key: s.key, value: String(s.value) }
    });
  }
  console.log(`✅ ${data.settings.length} configuraciones aseguradas.`);

  // 4. Restaurar Productos
  console.log('4. Restaurando Productos...');
  const productIdMap = new Map();
  for (const p of data.products) {
    const brandId = brandIdMap.get(p.brandId);
    const categoryId = categoryIdMap.get(p.categoryId);

    if (!brandId || !categoryId) {
      console.warn(`⚠️ Omitiendo producto ${p.name} (marca o categoría no encontrada)`);
      continue;
    }

    const prod = await prisma.product.create({
      data: {
        name: p.name,
        description: p.description,
        price: p.price,
        imageUrl: p.imageUrl,
        gender: p.gender,
        brandId: brandId,
        categoryId: categoryId,
        isAvailable: p.isAvailable ?? true,
        costPrice: p.costPrice ?? 0,
        stock: p.stock ?? 0,
      }
    });
    productIdMap.set(p.id, prod.id);
  }
  console.log(`✅ ${productIdMap.size} productos restaurados con éxito.`);

  // 5. Restaurar Pedidos
  console.log('5. Restaurando Pedidos...');
  for (const o of data.orders) {
    const validItems = (o.items || [])
      .filter(item => productIdMap.has(item.productId))
      .map(item => ({
        productId: productIdMap.get(item.productId),
        quantity: item.quantity,
        price: item.price
      }));

    await prisma.order.create({
      data: {
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        totalAmount: o.totalAmount,
        status: o.status,
        paymentMethod: o.paymentMethod,
        items: {
          create: validItems
        }
      }
    });
  }
  console.log(`✅ ${data.orders.length} pedidos restaurados.`);

  console.log('🎉 ¡Restauración completa y exitosa de Mayra Shop!');
}

main()
  .catch((e) => {
    console.error('❌ Error en la restauración:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
