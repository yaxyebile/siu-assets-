const https = require('https');

https.get('https://siu-assets.onrender.com/api/health', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('StatusCode:', res.statusCode);
        console.log('Headers:', res.headers);
        console.log('Body:', data);
    });
}).on('error', err => {
    console.error('Error:', err.message);
});
