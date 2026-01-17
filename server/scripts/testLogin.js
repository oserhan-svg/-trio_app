async function testLogin() {
    try {
        console.log('Attempting login...');
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@emlak22.com',
                password: 'admin123'
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Login Success:', data);
        } else {
            console.error('Login Failed:', response.status, data);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testLogin();
