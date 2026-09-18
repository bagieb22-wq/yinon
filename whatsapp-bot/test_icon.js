const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
const content = fs.readFileSync(filePath, 'utf8');

if (content.includes('fa-certificate') && !content.includes('fa-shield-check')) {
    console.log("TEST PASSED: Icon updated successfully");
} else {
    console.error("TEST FAILED");
    process.exit(1);
}
