const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const backupFile = path.join(__dirname, 'backup_mayrashop.json');
const imagesDir = path.join(__dirname, 'backup_images');

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const data = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
const products = data.products.filter(p => p.imageUrl && p.imageUrl.startsWith('http'));

console.log(`Encontrados ${products.length} productos con imagen. Iniciando descarga...`);

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    client.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      } else {
        file.close();
        fs.unlink(dest, () => {});
        reject(new Error(`Status ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  let downloaded = 0;
  let errors = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const ext = path.extname(p.imageUrl.split('?')[0]) || '.jpg';
    const filename = `product_${p.id}_${p.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}${ext}`;
    const dest = path.join(imagesDir, filename);

    try {
      await downloadImage(p.imageUrl, dest);
      downloaded++;
      process.stdout.write(`\rDescargadas: ${downloaded}/${products.length}`);
    } catch (e) {
      errors++;
      console.log(`\nError descargando producto ID ${p.id}: ${e.message}`);
    }
  }

  console.log(`\n\n🎉 ¡Descarga finalizada!`);
  console.log(`- Fotos descargadas correctamente: ${downloaded}`);
  console.log(`- Errores: ${errors}`);
  console.log(`📁 Fotos guardadas en: ${imagesDir}`);
}

run();
