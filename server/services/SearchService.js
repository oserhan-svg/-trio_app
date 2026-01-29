const axios = require('axios');
const cheerio = require('cheerio');

class SearchService {
    constructor() {
        this.baseUrl = 'https://html.duckduckgo.com/html';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };
    }

    async search(query) {
        try {
            console.log(`Searching Web for: ${query}`);
            const response = await axios.get(this.baseUrl, {
                params: { q: query },
                headers: this.headers
            });

            const $ = cheerio.load(response.data);
            const results = [];

            $('.result').each((i, element) => {
                if (i >= 5) return false; // Limit to 5 results

                const title = $(element).find('.result__title').text().trim();
                const url = $(element).find('.result__url').text().trim(); // Display URL (often truncated)
                const snippet = $(element).find('.result__snippet').text().trim();
                const link = $(element).find('.result__a').attr('href'); // Actual link

                if (title && snippet) {
                    results.push({
                        title,
                        snippet,
                        link: link ? decodeURIComponent(link) : null
                    });
                }
            });

            if (results.length === 0) {
                return "Arama sonucu bulunamadı.";
            }

            return results.map(r => `* ${r.title}\n  ${r.snippet}\n  Link: ${r.link}`).join('\n\n');

        } catch (error) {
            console.error('Search Service Error:', error.message);
            return "İnternet araması şu an yapılamıyor.";
        }
    }
}

module.exports = new SearchService();
