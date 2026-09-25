import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.setting.findMany();
    // Convert array of {key, value} to an object {key: value}
    const config = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // body is expected to be an object { whatsapp: '+1...', currency: 'USD' }
    for (const [key, value] of Object.entries(body)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
  }
}
