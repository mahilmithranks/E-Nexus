const API_URL = 'https://e-nexus-qvrc.vercel.app/api/auth/login';

// Test Credential (from seed.js)
const TEST_USER = '99230041142'; // Sabari Kumar V G
const TEST_PASS = '99230041142';

const testProdLogin = async () => {
    console.log(`Attempting login to: ${API_URL}`);
    console.log(`User: ${TEST_USER}`);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: TEST_USER,
                password: TEST_PASS
            })
        });

        console.log(`\nStatus: ${response.status} ${response.statusText}`);

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Login SUCCESS!');
            console.log('Token:', data.token ? 'Received (Hidden)' : 'Missing');
        } else {
            console.log('❌ Login FAILED');
            console.log('Error Message:', data.message);
        }
    } catch (error) {
        console.log('\n❌ Network/Script Error');
        console.log('Error:', error.message);
    }
};

testProdLogin();
