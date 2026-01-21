
const saved_properties = [
    { id: 1, added_at: "Tue Jan 20 2026 12:05:44", property: { id: 3795, url: "https://www.hepsiemlak.com/balikesir-ayvalik-150-evler-satilik/zeytinlik/163234-15" } },
    { id: 2, added_at: "Tue Jan 20 2026 12:05:45", property: { id: 3776, url: "https://www.hepsiemlak.com/balikesir-ayvalik-ali-cetinkaya-satilik/zeytinlik/128380-732" } },
    { id: 27, added_at: "Tue Jan 20 2026 14:32:17", property: { id: 4556, url: "https://www.hepsiemlak.com/balikesir-ayvalik-150-evler-kiralik/daire/93694-757" } },
    { id: 28, added_at: "Tue Jan 20 2026 14:32:21", property: { id: 4560, url: "https://www.hepsiemlak.com/balikesir-ayvalik-150-evler-kiralik/daire/93694-757" } },
    { id: 29, added_at: "Tue Jan 20 2026 15:19:02", property: { id: 4647, url: "https://www.hepsiemlak.com/balikesir-ayvalik-ali-cetinkaya-satilik/daire/95223-730" } },
    { id: 30, added_at: "Tue Jan 20 2026 15:19:02", property: { id: 4649, url: "https://www.hepsiemlak.com/balikesir-ayvalik-150-evler-satilik/daire/95223-752" } }
];

// Mock sorting
saved_properties.sort((a, b) => {
    return new Date(b.added_at) - new Date(a.added_at);
});

console.log('--- After Sort ---');
saved_properties.forEach(p => console.log(`${p.id} (${p.added_at})`));

// Mock dedupe
let result = saved_properties;
const seenUrls = new Set();
result = result.filter(sp => {
    if (!sp.property || !sp.property.url) return true;
    const normUrl = sp.property.url.split('?')[0].replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').toLowerCase();

    if (seenUrls.has(normUrl)) {
        console.log(`Duplicate removed: ${sp.id} (${normUrl})`);
        return false;
    }
    seenUrls.add(normUrl);
    return true;
});

console.log('--- After Dedupe ---');
result.forEach(p => console.log(`${p.id} (${p.added_at})`));
