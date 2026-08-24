import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

async function createIcon(size, name) {
  const image = new Jimp({ width: size, height: size, color: '#2D5A27' });
  const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  image.print(font, 0, size/2 - 16, { text: 'QAU', alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER }, size, size);
  await image.write(path.join('public', 'icons', name));
  console.log(`Created ${name}`);
}

async function run() {
  if (!fs.existsSync('public/icons')) {
    fs.mkdirSync('public/icons', { recursive: true });
  }
  await createIcon(192, 'icon-192.png');
  await createIcon(512, 'icon-512.png');
  await createIcon(180, 'apple-touch-icon.png');
}
run();
