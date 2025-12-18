
fetch('http://127.0.0.1:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@test.com', password: 'password123' })
})
    .then(async r => {
        console.log('Status:', r.status);
        const data = await r.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    })
    .catch(err => console.error('Error:', err));
