import fs from 'fs';
import path from 'path';

const root = process.cwd();
const targets = [
  path.join(root, 'dist'),
  path.join(root, '.tsbuildinfo'),
];

async function remove(target) {
  try {
    await fs.promises.rm(target, { recursive: true, force: true });
    console.log(`Removed: ${target}`);
  } catch (err) {
    if (err.code === 'ENOENT') return;
    throw err;
  }
}

(async () => {
  try {
    for (const t of targets) await remove(t);
  } catch (error) {
    console.error('Cleaning failed:', error);
    process.exit(1);
  }
})();
