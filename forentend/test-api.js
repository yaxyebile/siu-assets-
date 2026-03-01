async function testApi() {
    try {
        const res = await fetch('https://siu-assets.onrender.com/api/health');
        const text = await res.text();
        console.log('Health Status:', res.status);
        console.log('Health Body:', text);
    } catch (e) {
        console.log('Health Error', e.message);
    }
}

testApi();
