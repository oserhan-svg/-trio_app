const stripHtml = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/<[^>]*>?/gm, '');
};

module.exports = { stripHtml };
