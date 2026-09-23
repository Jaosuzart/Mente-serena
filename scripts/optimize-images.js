const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, '../src/frontend/assets/images');

const files = ['logo-premium.webp', 'logo-ai.jpg', 'hero.webp'];

console.log('Tentando re-comprimir arquivos que falharam...\n');

Promise.all(files.map(async file => {
    const inputPath = path.join(imagesDir, file);
    if (!fs.existsSync(inputPath)) return;
    
    const statsOriginal = fs.statSync(inputPath);
    const sizeOriginalKb = (statsOriginal.size / 1024).toFixed(2);
    
    try {
        const fileBuffer = fs.readFileSync(inputPath);
        let sharpInstance = sharp(fileBuffer);
        
        if (file === 'logo-premium.webp') {
            sharpInstance = sharpInstance.resize({ width: 400, withoutEnlargement: true });
        }
        
        let outputBuffer;
        if (file.endsWith('.jpg')) {
            outputBuffer = await sharpInstance.jpeg({ quality: 80 }).toBuffer();
        } else {
            outputBuffer = await sharpInstance.webp({ quality: 75, effort: 6 }).toBuffer();
        }
            
        fs.writeFileSync(inputPath, outputBuffer);
        
        const statsNew = fs.statSync(inputPath);
        const sizeNewKb = (statsNew.size / 1024).toFixed(2);
        
        console.log(`[OK] ${file}: ${sizeOriginalKb}KB -> ${sizeNewKb}KB`);
    } catch (error) {
        console.error(`[ERRO] Falha ao processar ${file}:`, error.message);
    }
})).then(() => {
    console.log('\nRetentativa concluída!');
});
