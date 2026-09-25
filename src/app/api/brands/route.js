import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(brands);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener las marcas' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });

    const newBrand = await prisma.brand.create({
      data: { name }
    });
    return NextResponse.json(newBrand);
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear la marca' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    
    // Verificar si hay productos asociados
    const productsCount = await prisma.product.count({ where: { brandId: id } });
    if (productsCount > 0) {
      return NextResponse.json({ error: 'No se puede eliminar: hay productos asociados a esta marca.' }, { status: 400 });
    }

    await prisma.brand.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar la marca' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, name } = await request.json();
    const updatedBrand = await prisma.brand.update({
      where: { id },
      data: { name }
    });
    return NextResponse.json(updatedBrand);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar la marca' }, { status: 500 });
  }
}
