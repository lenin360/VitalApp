const selfsigned = require('selfsigned');
const fs = require('fs');

async function main() {
    const attrs = [{ name: 'commonName', value: 'localhost' }];
    const pems = await selfsigned.generate(attrs, { days: 365 });
    fs.writeFileSync('key.pem', pems.private);
    fs.writeFileSync('cert.pem', pems.cert);
    console.log('Certificates generated successfully');
}
main();
