import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener las categorías' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });

    const newCategory = await prisma.category.create({
      data: { name }
    });
    return NextResponse.json(newCategory);
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear la categoría' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();

    // Verificar si hay productos asociados
    const productsCount = await prisma.product.count({ where: { categoryId: id } });
    if (productsCount > 0) {
      return NextResponse.json({ error: 'No se puede eliminar: hay productos asociados a esta categoría.' }, { status: 400 });
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar la categoría' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, name } = await request.json();
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { name }
    });
    return NextResponse.json(updatedCategory);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar la categoría' }, { status: 500 });
  }
}
