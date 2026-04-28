const fs = require('fs');
const content = fs.readFileSync('form.html', 'utf16le');
const nameMatch = content.match(/Name.*?(\d{8,10})/i);
const emailMatch = content.match(/Email.*?(\d{8,10})/i);
const expMatch = content.match(/Experience.*?(\d{8,10})/i);
console.log('Name ID:', nameMatch ? nameMatch[1] : null);
console.log('Email ID:', emailMatch ? emailMatch[1] : null);
console.log('Experience ID:', expMatch ? expMatch[1] : null);
