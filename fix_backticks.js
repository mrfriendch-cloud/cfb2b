const fs = require('fs');
const file = 'src/pages/admin-dashboard.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('preview.innerHTML = `<img src="${product.image_url}" alt="Product preview">`;', 'preview.innerHTML = \\`<img src="\\${product.image_url}" alt="Product preview">\\`;');

fs.writeFileSync(file, content, 'utf8');
console.log("Replaced missing product preview");
