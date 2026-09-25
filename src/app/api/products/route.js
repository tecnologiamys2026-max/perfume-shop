import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { put } from '@vercel/blob';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: { brand: true, category: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.formData();
    const file = data.get('image');
    const name = data.get('name');
    const price = data.get('price');
    const gender = data.get('gender');
    const brandId = data.get('brandId');
    const categoryId = data.get('categoryId');

    if (!name || !price || !brandId || !categoryId) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    let imageUrl = '';
    
    // Si el usuario subió un archivo de imagen, guardarlo en Vercel Blob
    if (file && file.name) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const uniqueName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      
      // Subir archivo a Vercel Blob
      const blob = await put(`products/${uniqueName}`, buffer, {
        access: 'public',
        contentType: file.type || 'image/jpeg',
      });
      
      // Guardar la URL pública generada por Vercel
      imageUrl = blob.url;
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        gender,
        brandId: parseInt(brandId),
        categoryId: parseInt(categoryId),
        imageUrl
      },
      include: { brand: true, category: true }
    });

    return NextResponse.json(newProduct);
  } catch (error) {
    console.error("Error al guardar:", error);
    return NextResponse.json({ error: 'Error al crear el producto' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar el producto' }, { status: 500 });
  }
}
