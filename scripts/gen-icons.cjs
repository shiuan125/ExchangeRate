// 一次性工具腳本：從 public/favicon.svg 產生 PWA manifest 用的 PNG icon。
// sharp 不是專案依賴，跑之前先 `npm install --no-save sharp`。
const sharp = require('sharp');
const fs = require('fs');

const svg = fs.readFileSync('public/favicon.svg', 'utf8')
  .replace(/@media[\s\S]*?\}\s*\}/, '');

const sizes = [192, 512];
(async () => {
  for (const size of sizes) {
    await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`public/icon-${size}.png`);
    console.log('wrote', size);
  }
  const maskableSvg = svg.replace('viewBox="0 0 32 32"', 'viewBox="-4.8 -4.8 41.6 41.6"');
  await sharp(Buffer.from(maskableSvg)).resize(512, 512).png().toFile('public/icon-512-maskable.png');
  console.log('wrote maskable');
})();
