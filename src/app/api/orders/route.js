import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener facturas' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { customerName, customerPhone, paymentMethod, items, status = 'COMPLETED' } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    }

    // Calcular total
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Iniciar transacción para asegurar que todo se guarde y descuente al mismo tiempo
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear la orden
      const order = await tx.order.create({
        data: {
          customerName,
          customerPhone,
          paymentMethod,
          totalAmount,
          status: status,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        },
        include: { items: true }
      });

      // 2. Descontar el inventario solo si el pedido está completado
      if (status === 'COMPLETED') {
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          });
        }
      }

      return order;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error al crear factura:", error);
    return NextResponse.json({ error: 'Error al procesar la factura' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, status } = await request.json();
    
    // Si cambia a COMPLETED, necesitamos restar el inventario
    if (status === 'COMPLETED') {
      const result = await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id },
          include: { items: true }
        });
        
        if (order.status !== 'COMPLETED') {
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } }
            });
          }
        }
        
        return await tx.order.update({
          where: { id },
          data: { status }
        });
      });
      return NextResponse.json(result);
    } else {
      const order = await prisma.order.update({
        where: { id },
        data: { status }
      });
      return NextResponse.json(order);
    }
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar pedido' }, { status: 500 });
  }
}
