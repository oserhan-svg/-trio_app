const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

class CalendarService {
    constructor() {
        this.oauth2Client = null;
        this.calendar = null;
        this.initialized = false;
    }

    /**
     * Initialize Google Calendar API with OAuth2
     * @param {string} refreshToken - User's refresh token
     */
    async initialize(refreshToken) {
        try {
            const clientId = process.env.GOOGLE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
            const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/calendar/callback';

            if (!clientId || !clientSecret) {
                throw new Error('Google OAuth credentials not configured');
            }

            this.oauth2Client = new google.auth.OAuth2(
                clientId,
                clientSecret,
                redirectUri
            );

            if (refreshToken) {
                this.oauth2Client.setCredentials({
                    refresh_token: refreshToken
                });
            }

            this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
            this.initialized = true;
        } catch (error) {
            console.error('Calendar service initialization error:', error);
            throw error;
        }
    }

    /**
     * Get OAuth2 authorization URL
     */
    getAuthUrl() {
        if (!this.oauth2Client) {
            const clientId = process.env.GOOGLE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
            const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/calendar/callback';

            this.oauth2Client = new google.auth.OAuth2(
                clientId,
                clientSecret,
                redirectUri
            );
        }

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/calendar']
        });
    }

    /**
     * Exchange authorization code for tokens
     */
    async getTokens(code) {
        const { tokens } = await this.oauth2Client.getToken(code);
        return tokens;
    }

    /**
     * Create a calendar event
     * @param {object} eventDetails - Event details (summary, description, start, end, etc.)
     */
    async createEvent(eventDetails) {
        if (!this.initialized) {
            throw new Error('Calendar service not initialized');
        }

        try {
            const event = {
                summary: eventDetails.summary,
                description: eventDetails.description || '',
                start: {
                    dateTime: eventDetails.startTime,
                    timeZone: 'Europe/Istanbul'
                },
                end: {
                    dateTime: eventDetails.endTime,
                    timeZone: 'Europe/Istanbul'
                },
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'popup', minutes: 30 },
                        { method: 'popup', minutes: 10 }
                    ]
                }
            };

            if (eventDetails.attendees && eventDetails.attendees.length > 0) {
                event.attendees = eventDetails.attendees.map(email => ({ email }));
            }

            const response = await this.calendar.events.insert({
                calendarId: 'primary',
                resource: event
            });

            return response.data;
        } catch (error) {
            console.error('Error creating calendar event:', error);
            throw error;
        }
    }

    /**
     * List upcoming events
     */
    async listEvents(maxResults = 10) {
        if (!this.initialized) {
            throw new Error('Calendar service not initialized');
        }

        try {
            const response = await this.calendar.events.list({
                calendarId: 'primary',
                timeMin: new Date().toISOString(),
                maxResults: maxResults,
                singleEvents: true,
                orderBy: 'startTime'
            });

            return response.data.items;
        } catch (error) {
            console.error('Error listing calendar events:', error);
            throw error;
        }
    }

    /**
     * Delete a calendar event
     */
    async deleteEvent(eventId) {
        if (!this.initialized) {
            throw new Error('Calendar service not initialized');
        }

        try {
            await this.calendar.events.delete({
                calendarId: 'primary',
                eventId: eventId
            });
            return true;
        } catch (error) {
            console.error('Error deleting calendar event:', error);
            throw error;
        }
    }
}

module.exports = new CalendarService();
