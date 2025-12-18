const fs = require('fs');
const path = 'prisma/schema.prisma';

try {
    let content = fs.readFileSync(path, 'binary'); // Read as binary first

    // Detect and remove UTF-16 LE BOM (FF FE)
    if (content.charCodeAt(0) === 0xFF && content.charCodeAt(1) === 0xFE) {
        console.log('Detected UTF-16 LE BOM. Converting...');
        const buffer = fs.readFileSync(path);
        content = buffer.toString('utf16le');
    } else if (content.charCodeAt(0) === 0xEF && content.charCodeAt(1) === 0xBB && content.charCodeAt(2) === 0xBF) {
        // UTF-8 BOM
        console.log('Detected UTF-8 BOM. Removing...');
        content = fs.readFileSync(path, 'utf8');
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }
    } else {
        // Fallback read as utf8
        content = fs.readFileSync(path, 'utf8');
    }

    // Ensure it starts with basic char
    content = content.trim();

    fs.writeFileSync(path, content, 'utf8');
    console.log('Fixed schema encoding. Length:', content.length);
} catch (e) {
    console.error('Error fixing schema:', e);
}
