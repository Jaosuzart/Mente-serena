const sharp = require('sharp');
const path = require('path');

async function processImages() {
  const alanSrc = 'C:/Users/Joao/.gemini/antigravity/brain/98152592-5e00-43bd-a352-24485552dcd7/.user_uploaded/media_1794225609140_c8322b47.jpg';
  const niltonSrc = 'C:/Users/Joao/.gemini/antigravity/brain/98152592-5e00-43bd-a352-24485552dcd7/.user_uploaded/media_1794225609150_6132f2ec.jpg';
  const luanSrc = 'C:/Users/Joao/.gemini/antigravity/brain/98152592-5e00-43bd-a352-24485552dcd7/.user_uploaded/media_1794225609155_eff55f06.jpg';

  const outDir = path.join(__dirname, '../src/frontend/assets/images');

  // SVG mask for 224x224 circle (WhatsApp avatar in 460x1024 screenshot)
  const mask224 = Buffer.from('<svg width="224" height="224"><circle cx="112" cy="112" r="111" fill="#fff"/></svg>');

  // 1. Alan Suzart
  await sharp(alanSrc)
    .extract({ left: 118, top: 306, width: 224, height: 224 })
    .composite([{ input: mask224, blend: 'dest-in' }])
    .webp({ quality: 90 })
    .toFile(path.join(outDir, 'alan-suzart.webp'));
  console.log('✅ alan-suzart.webp gerado com sucesso!');

  // 2. Nilton Lima Filho
  await sharp(niltonSrc)
    .extract({ left: 118, top: 306, width: 224, height: 224 })
    .composite([{ input: mask224, blend: 'dest-in' }])
    .webp({ quality: 90 })
    .toFile(path.join(outDir, 'nilton-lima-filho.webp'));
  console.log('✅ nilton-lima-filho.webp gerado com sucesso!');

  // 3. Luan Castro
  const mask400 = Buffer.from('<svg width="400" height="400"><circle cx="200" cy="200" r="199" fill="#fff"/></svg>');
  await sharp(luanSrc)
    .extract({ left: 63, top: 190, width: 450, height: 450 })
    .resize(400, 400)
    .composite([{ input: mask400, blend: 'dest-in' }])
    .webp({ quality: 90 })
    .toFile(path.join(outDir, 'luan-castro.webp'));
  console.log('✅ luan-castro.webp gerado com sucesso!');
}

processImages().catch(err => {
  console.error('Erro ao processar imagens:', err);
  process.exit(1);
});
