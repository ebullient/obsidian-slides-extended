import { cp } from 'node:fs/promises';
import path from 'node:path';

const directories = ['plugin', 'template', 'css', 'dist'];

async function main() {
    const buildDir = './build';
    
    for (const dir of directories) {
        const src = path.join('.', dir);
        const dest = path.join(buildDir, dir);
        try {
            await cp(src, dest, { 
                recursive: true, 
                force: true
            });
            console.log(`Copied ${src} -> ${dest}`);
        } catch (error) {
            console.error(`Error copying ${src} to ${dest}:`, error.message);
        }
    }
    
    console.log('Asset copy completed');
}

main().catch(console.error);