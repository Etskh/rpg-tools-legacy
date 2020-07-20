const fs = require('fs');

const data = fs.readFileSync('.env');
const lines = data.toString().split('\n');

lines.forEach(line => {
    // Get out of here if it's a comment
    if(line.startsWith('#')) {
        return;
    }
    // Now take each line and if we have an equals sign, take the right half
    const fields = line.split('=');
    if(fields.length > 1) {
        const name = fields[0].replace(/\W/g, '');
        const value = fields[1].replace(/\W/g, '');
        process.env[name] = value;
    }
});