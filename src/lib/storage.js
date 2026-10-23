import { v2 as cloudinary } from 'cloudinary';
import { put } from '@vercel/blob';

// Configurar Cloudinary si las variables de entorno existen
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Sube una imagen ya sea a Cloudinary (recomendado para Render/VPS)
 * o a Vercel Blob (si sigue en Vercel) de forma 100% automática y transparente.
 * 
 * @param {File} file - Archivo proveniente de FormData
 * @returns {Promise<string>} URL pública y segura de la imagen
 */
export async function uploadImage(file) {
  if (!file || !file.name || file.size === 0) {
    return '';
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uniqueName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

  // 1. Si está configurado Cloudinary (para Render, VPS o cualquier hosting)
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'perfumes',
          resource_type: 'image',
          public_id: uniqueName.split('.')[0],
        },
        (error, result) => {
          if (error) {
            console.error('Error subiendo a Cloudinary:', error);
            reject(error);
          } else {
            resolve(result.secure_url);
          }
        }
      );
      uploadStream.end(buffer);
    });
  }

  // 2. Si está configurado Vercel Blob (por compatibilidad en Vercel)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`products/${uniqueName}`, buffer, {
      access: 'public',
      contentType: file.type || 'image/jpeg',
    });
    return blob.url;
  }

  // 3. Fallback: Data URI base64 en caso de no tener ningún servicio configurado aún
  const base64 = buffer.toString('base64');
  const mimeType = file.type || 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}
