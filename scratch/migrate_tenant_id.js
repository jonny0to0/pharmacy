import fs from 'fs';
import path from 'path';

// Use absolute path for safety
const srcDir = 'c:\\xampp\\htdocs\\pharmacy_billing\\backend\\src';

function replaceInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content.replace(/\bbusinessId\b/g, 'tenantId');
            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

replaceInDir(srcDir);
console.log('Global replacement completed.');
