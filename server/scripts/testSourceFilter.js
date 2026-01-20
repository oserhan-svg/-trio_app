const axios = require('axios');

async function test() {
    const baseUrl = 'http://localhost:5000/api'; // Adjust if different
    try {
        const resSah = await axios.get(`${baseUrl}/properties?source=sahibinden&limit=1`);
        console.log('Sahibinden count:', resSah.data.meta.total);

        const resHep = await axios.get(`${baseUrl}/properties?source=hepsiemlak&limit=1`);
        console.log('Hepsiemlak count:', resHep.data.meta.total);

        const resAll = await axios.get(`${baseUrl}/properties?limit=1`);
        console.log('All count:', resAll.data.meta.total);

        if (resSah.data.meta.total + resHep.data.meta.total >= resAll.data.meta.total) {
            console.log('Source filter seems to be working.');
        } else {
            console.log('Warning: Sum of sources < total (might be other sources or data issues).');
        }
    } catch (e) {
        console.log('Test failed (is server running?):', e.message);
    }
}
test();
