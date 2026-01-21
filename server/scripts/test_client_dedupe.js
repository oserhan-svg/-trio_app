
const client = {
    saved_properties: [
        { id: 1, property: { id: 4556, url: "https://www.hepsiemlak.com/balikesir-ayvalik-150-evler-kiralik/daire/93694-757" } },
        { id: 2, property: { id: 4560, url: "https://www.hepsiemlak.com/balikesir-ayvalik-150-evler-kiralik/daire/93694-757" } }, // Duplicate URL
        { id: 3, property: { id: 4553, url: "https://www.hepsiemlak.com/balikesir-ayvalik-150-evler-kiralik/daire/107490-1044" } }
    ]
};

console.log("Before:", client.saved_properties.length);

if (client.saved_properties && client.saved_properties.length > 0) {
    const seenUrls = new Set();
    client.saved_properties = client.saved_properties.filter(sp => {
        if (!sp.property || !sp.property.url) return true;
        const normUrl = sp.property.url.split('?')[0].replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').toLowerCase();

        console.log(`Checking: ${normUrl}`);
        if (seenUrls.has(normUrl)) {
            console.log("  -> Duplicate!");
            return false;
        }
        seenUrls.add(normUrl);
        return true;
    });
}

console.log("After:", client.saved_properties.length);
