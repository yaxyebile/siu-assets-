fetch('https://siu-assets.onrender.com/api/health')
    .then(res => res.json().then(data => console.log('Data:', data)))
    .catch(err => console.error('Fetch Error:', err.message, err.cause));
