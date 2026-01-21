
// Generic CSV Parser for Google Contacts, Outlook, and Custom CSVs
// Tries to map common headers to { name, phone, email, notes }

export const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            const data = [];

            for (let i = 1; i < lines.length; i++) {
                // Determine quote handling (basic)
                const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => cell.trim().replace(/^"|"$/g, ''));
                if (row.length < headers.length) continue; // Skip malformed

                const record = {};
                headers.forEach((h, idx) => {
                    record[h] = row[idx];
                });
                data.push(record);
            }

            const mapped = data.map(rec => mapToClient(rec, headers)).filter(c => c.name && c.phone);
            resolve(mapped);
        };

        reader.onerror = (err) => reject(err);
        reader.readAsText(file);
    });
};

const mapToClient = (record, headers) => {
    // Heuristic Mapping

    // 1. Name
    let name = '';
    if (record['Name']) name = record['Name'];
    else if (record['First Name'] && record['Last Name']) name = `${record['First Name']} ${record['Last Name']}`;
    else if (record['Given Name'] && record['Family Name']) name = `${record['Given Name']} ${record['Family Name']}`; // Google
    else if (record['Ad'] && record['Soyad']) name = `${record['Ad']} ${record['Soyad']}`;
    else if (record['First Name']) name = record['First Name']; // Outlook
    else if (record['Display Name']) name = record['Display Name'];

    // 2. Phone (Try multiple fields)
    let phone = '';
    // Priority list of headers
    const phoneKeys = [
        'Mobile Phone', 'Mobile', 'Phone 1 - Value', 'Phone 1', 'Cep Telefonu', 'Telefon',
        'Business Phone', 'Home Phone', 'Phone', 'Cell'
    ];

    for (const key of phoneKeys) {
        // Direct match
        if (record[key]) {
            phone = record[key];
            break;
        }
        // Partial match check (e.g. Google's "Phone 1 - Value")
        const foundKey = headers.find(h => h.includes(key));
        if (foundKey && record[foundKey]) {
            phone = record[foundKey];
            break;
        }
    }

    // Clean Phone
    if (phone) {
        phone = phone.replace(/[^0-9+]/g, '');
        // Ensure TR format if local
        if (phone.startsWith('05')) phone = '+9' + phone;
        if (phone.startsWith('5')) phone = '+90' + phone;
    }

    // 3. Email
    let email = '';
    const emailKeys = ['E-mail Address', 'Email', 'E-mail 1 - Value', 'E-posta'];
    for (const key of emailKeys) {
        if (record[key]) {
            email = record[key];
            break;
        }
        const foundKey = headers.find(h => h.includes(key));
        if (foundKey && record[foundKey]) {
            email = record[foundKey];
            break;
        }
    }

    return { name, phone, email, notes: 'Imported from CSV' };
};
