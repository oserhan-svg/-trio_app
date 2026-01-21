const location = 'Küçükköy\nKüçükköy Mh.';
console.log('Original:', JSON.stringify(location));

const parts = location.split(/[\/\n\r]+/).map(s => s.trim()).filter(s => s.length > 0);
console.log('Parts:', parts);
console.log('Length:', parts.length);
console.log('Index 1:', parts[1]);

const location2 = "Balıkesir / Ayvalık / Cunda";
const parts2 = location2.split(/[\/\n\r]+/).map(s => s.trim()).filter(s => s.length > 0);
console.log('Parts2:', parts2);
console.log('Parts2 Length:', parts2.length);

const location3 = "Ayvalık";
const parts3 = location3.split(/[\/\n\r]+/).map(s => s.trim()).filter(s => s.length > 0);
console.log('Parts3:', parts3);
