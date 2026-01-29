const { google } = require('googleapis');
const prisma = require('../db');

class GoogleCalendarService {
    constructor() {
        this.oauth2Client = null;
    }

    initClient() {
        if (!this.oauth2Client) {
            console.log('--- GOOGLE OAUTH INIT ---');
            console.log('ID:', process.env.GOOGLE_CLIENT_ID ? 'FOUND (' + process.env.GOOGLE_CLIENT_ID.substring(0, 10) + '...)' : 'MISSING');
            console.log('SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'FOUND' : 'MISSING');
            console.log('REDIRECT:', process.env.GOOGLE_REDIRECT_URI);

            this.oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI
            );
        }
    }

    getAuthUrl(userId) {
        this.initClient();

        // Safety check: If client_id is STILL missing after init, log a critical error
        if (!process.env.GOOGLE_CLIENT_ID) {
            console.error('CRITICAL ERROR: GOOGLE_CLIENT_ID is missing from process.env at runtime!');
        }

        const url = this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/calendar'],
            state: userId.toString(),
            prompt: 'consent'
        });
        console.log('--- GOOGLE DEBUG: Generated Auth URL ---');
        console.log(url);
        return url;
    }

    async getTokens(code) {
        this.initClient();
        const { tokens } = await this.oauth2Client.getToken(code);
        return tokens;
    }

    async setCredentials(userId) {
        this.initClient();
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                google_access_token: true,
                google_refresh_token: true,
                google_token_expiry: true
            }
        });

        if (!user || !user.google_refresh_token) {
            throw new Error('Google Calendar not connected for this user');
        }

        this.oauth2Client.setCredentials({
            access_token: user.google_access_token,
            refresh_token: user.google_refresh_token,
            expiry_date: user.google_token_expiry ? new Date(user.google_token_expiry).getTime() : null
        });

        // Handle token refresh
        this.oauth2Client.on('tokens', async (tokens) => {
            if (tokens.refresh_token) {
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        google_access_token: tokens.access_token,
                        google_refresh_token: tokens.refresh_token,
                        google_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
                    }
                });
            } else {
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        google_access_token: tokens.access_token,
                        google_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
                    }
                });
            }
        });

        return this.oauth2Client;
    }

    async listEvents(userId, timeMin = new Date().toISOString()) {
        try {
            const auth = await this.setCredentials(userId);
            const calendar = google.calendar({ version: 'v3', auth });

            const response = await calendar.events.list({
                calendarId: 'primary',
                timeMin: timeMin,
                maxResults: 50,
                singleEvents: true,
                orderBy: 'startTime',
            });

            return response.data.items;
        } catch (error) {
            console.error('Error listing Google Calendar events:', error);
            throw error;
        }
    }

    async createEvent(userId, eventDetails) {
        try {
            const auth = await this.setCredentials(userId);
            const calendar = google.calendar({ version: 'v3', auth });

            const event = {
                summary: eventDetails.title,
                description: eventDetails.description,
                start: {
                    dateTime: new Date(eventDetails.start_at).toISOString(),
                    timeZone: 'Europe/Istanbul',
                },
                end: {
                    dateTime: eventDetails.end_at ? new Date(eventDetails.end_at).toISOString() : new Date(new Date(eventDetails.start_at).getTime() + 30 * 60000).toISOString(),
                    timeZone: 'Europe/Istanbul',
                },
            };

            const response = await calendar.events.insert({
                calendarId: 'primary',
                resource: event,
            });

            return response.data;
        } catch (error) {
            console.error('Error creating Google Calendar event:', error);
            throw error;
        }
    }

    async updateEvent(userId, googleEventId, eventDetails) {
        try {
            const auth = await this.setCredentials(userId);
            const calendar = google.calendar({ version: 'v3', auth });

            const event = {
                summary: eventDetails.title,
                description: eventDetails.description,
                start: {
                    dateTime: new Date(eventDetails.start_at).toISOString(),
                    timeZone: 'Europe/Istanbul',
                },
                end: {
                    dateTime: eventDetails.end_at ? new Date(eventDetails.end_at).toISOString() : new Date(new Date(eventDetails.start_at).getTime() + 30 * 60000).toISOString(),
                    timeZone: 'Europe/Istanbul',
                },
            };

            const response = await calendar.events.update({
                calendarId: 'primary',
                eventId: googleEventId,
                resource: event,
            });

            return response.data;
        } catch (error) {
            console.error('Error updating Google Calendar event:', error);
            throw error;
        }
    }

    async deleteEvent(userId, googleEventId) {
        try {
            const auth = await this.setCredentials(userId);
            const calendar = google.calendar({ version: 'v3', auth });

            await calendar.events.delete({
                calendarId: 'primary',
                eventId: googleEventId,
            });

            return true;
        } catch (error) {
            console.error('Error deleting Google Calendar event:', error);
            throw error;
        }
    }

    async checkAvailability(userId, start, end) {
        try {
            const auth = await this.setCredentials(userId);
            const calendar = google.calendar({ version: 'v3', auth });

            const response = await calendar.freebusy.query({
                resource: {
                    timeMin: new Date(start).toISOString(),
                    timeMax: new Date(end).toISOString(),
                    items: [{ id: 'primary' }],
                }
            });

            const busy = response.data.calendars.primary.busy;
            return busy.length === 0;
        } catch (error) {
            console.error('Error checking availability:', error);
            return true; // Fallback to true if check fails to not block scheduling, or false to be safe? Let's say true but log error.
        }
    }
}

module.exports = new GoogleCalendarService();
