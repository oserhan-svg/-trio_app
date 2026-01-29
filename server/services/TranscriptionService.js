const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

class TranscriptionService {
    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            console.error('TranscriptionService: OPENAI_API_KEY is missing!');
        }
        if (process.env.OPENAI_API_KEY) {
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
        } else {
            console.warn('TranscriptionService: OpenAI API key is missing. Transcription disabled.');
        }
    }

    /**
     * Transcribes a media buffer (voice message) to text
     * @param {Buffer} buffer - The audio file buffer
     * @param {string} mimetype - File mimetype (e.g., audio/ogg; codecs=opus)
     * @returns {Promise<string|null>}
     */
    async transcribeAudio(buffer, mimetype) {
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        // Map mimetype to extension for Whisper (prefers mp3, ogg, m4a, etc)
        let ext = 'ogg';
        if (mimetype.includes('mp4') || mimetype.includes('m4a')) ext = 'm4a';
        if (mimetype.includes('mpeg')) ext = 'mp3';

        const tempFilePath = path.join(tempDir, `transcription_${Date.now()}.${ext}`);

        try {
            await writeFile(tempFilePath, buffer);

            const transcription = await this.openai.audio.transcriptions.create({
                file: fs.createReadStream(tempFilePath),
                model: "whisper-1",
                language: "tr" // Priority to Turkish
            });

            return transcription.text;
        } catch (error) {
            console.error('Transcription Error:', error);
            return null;
        } finally {
            if (fs.existsSync(tempFilePath)) {
                await unlink(tempFilePath).catch(err => console.error('Error deleting temp audio:', err));
            }
        }
    }
}

module.exports = new TranscriptionService();
