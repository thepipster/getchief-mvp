import { readFileSync } from 'fs';

interface CalendarEvent {
    uid: string;
    summary: string;
    dtstart: string;
    dtend: string;
    dtstamp: string;
    created?: string;
    lastModified?: string;
    sequence?: number;
    status?: string;
    transp?: string;
    description?: string;
    location?: string;
    organizer?: string;
    attendees?: string[];
}

interface CalendarData {
    prodid: string;
    version: string;
    calscale: string;
    method?: string;
    calname?: string;
    timezone?: string;
    timezones: any[];
    events: CalendarEvent[];
}

export class CalReader {
    private calendarData: CalendarData;

    constructor(icalFilePath: string) {
        this.calendarData = {
            prodid: '',
            version: '',
            calscale: '',
            calname: '',
            timezone: '',
            timezones: [],
            events: [],
        };

        this.parseICalFile(icalFilePath);
    }

    private parseICalFile(filePath: string): void {
        try {
            const fileContent = readFileSync(filePath, 'utf8');
            this.parseICalContent(fileContent);
        } catch (error) {
            throw new Error(`Failed to read iCal file: ${error}`);
        }
    }

    private parseICalContent(content: string): void {
        const lines = content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        let currentEvent: Partial<CalendarEvent> | null = null;
        let currentTimezone: any = null;
        let inTimezone = false;
        let inEvent = false;

        for (const line of lines) {
            if (line.startsWith('BEGIN:VCALENDAR')) {
                continue;
            } else if (line.startsWith('END:VCALENDAR')) {
                break;
            } else if (line.startsWith('BEGIN:VTIMEZONE')) {
                inTimezone = true;
                currentTimezone = {};
            } else if (line.startsWith('END:VTIMEZONE')) {
                if (currentTimezone) {
                    this.calendarData.timezones.push(currentTimezone);
                }
                inTimezone = false;
                currentTimezone = null;
            } else if (line.startsWith('BEGIN:VEVENT')) {
                inEvent = true;
                currentEvent = {};
            } else if (line.startsWith('END:VEVENT')) {
                if (currentEvent && currentEvent.uid) {
                    this.calendarData.events.push(currentEvent as CalendarEvent);
                }
                inEvent = false;
                currentEvent = null;
            } else if (inTimezone && currentTimezone) {
                this.parseTimezoneProperty(line, currentTimezone);
            } else if (inEvent && currentEvent) {
                this.parseEventProperty(line, currentEvent);
            } else {
                this.parseCalendarProperty(line);
            }
        }
    }

    private parseCalendarProperty(line: string): void {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':');

        switch (key) {
            case 'PRODID':
                this.calendarData.prodid = value;
                break;
            case 'VERSION':
                this.calendarData.version = value;
                break;
            case 'CALSCALE':
                this.calendarData.calscale = value;
                break;
            case 'METHOD':
                this.calendarData.method = value;
                break;
            case 'X-WR-CALNAME':
                this.calendarData.calname = value;
                break;
            case 'X-WR-TIMEZONE':
                this.calendarData.timezone = value;
                break;
        }
    }

    private parseTimezoneProperty(line: string, timezone: any): void {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':');

        if (line.startsWith('BEGIN:') || line.startsWith('END:')) {
            return;
        }

        timezone[key.toLowerCase()] = value;
    }

    private parseEventProperty(line: string, event: Partial<CalendarEvent>): void {
        const [keyPart, ...valueParts] = line.split(':');
        const value = valueParts.join(':');

        // Handle properties with parameters (e.g., DTSTART;VALUE=DATE:20250714)
        const [key, ...params] = keyPart.split(';');

        switch (key) {
            case 'UID':
                event.uid = value;
                break;
            case 'SUMMARY':
                event.summary = value;
                break;
            case 'DTSTART':
                event.dtstart = this.formatDateTime(value);
                break;
            case 'DTEND':
                event.dtend = this.formatDateTime(value);
                break;
            case 'DTSTAMP':
                event.dtstamp = this.formatDateTime(value);
                break;
            case 'CREATED':
                event.created = this.formatDateTime(value);
                break;
            case 'LAST-MODIFIED':
                event.lastModified = this.formatDateTime(value);
                break;
            case 'SEQUENCE':
                event.sequence = parseInt(value, 10);
                break;
            case 'STATUS':
                event.status = value;
                break;
            case 'TRANSP':
                event.transp = value;
                break;
            case 'DESCRIPTION':
                event.description = value.replace(/\\n/g, '\n').replace(/\\,/g, ',');
                break;
            case 'LOCATION':
                event.location = value;
                break;
            case 'ORGANIZER':
                event.organizer = value;
                break;
            case 'ATTENDEE':
                if (!event.attendees) {
                    event.attendees = [];
                }
                event.attendees.push(value);
                break;
        }
    }

    private formatDateTime(dateTimeString: string): string {
        // Handle different date/time formats from iCal
        if (dateTimeString.length === 8) {
            // Date only format: YYYYMMDD
            const year = dateTimeString.substring(0, 4);
            const month = dateTimeString.substring(4, 6);
            const day = dateTimeString.substring(6, 8);
            return `${year}-${month}-${day}`;
        } else if (dateTimeString.length === 15 && dateTimeString.endsWith('Z')) {
            // UTC format: YYYYMMDDTHHMMSSZ
            const year = dateTimeString.substring(0, 4);
            const month = dateTimeString.substring(4, 6);
            const day = dateTimeString.substring(6, 8);
            const hour = dateTimeString.substring(9, 11);
            const minute = dateTimeString.substring(11, 13);
            const second = dateTimeString.substring(13, 15);
            return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
        } else if (dateTimeString.length === 15) {
            // Local format: YYYYMMDDTHHMMSS
            const year = dateTimeString.substring(0, 4);
            const month = dateTimeString.substring(4, 6);
            const day = dateTimeString.substring(6, 8);
            const hour = dateTimeString.substring(9, 11);
            const minute = dateTimeString.substring(11, 13);
            const second = dateTimeString.substring(13, 15);
            return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
        }

        return dateTimeString; // Return as-is if format is not recognized
    }

    public toJSON(): CalendarData {
        return this.calendarData;
    }

    public getEvents(): CalendarEvent[] {
        return this.calendarData.events;
    }

    public getEventCount(): number {
        return this.calendarData.events.length;
    }

    public getEventsByDateRange(startDate: Date, endDate: Date): CalendarEvent[] {
        return this.calendarData.events.filter(event => {
            const eventStart = new Date(event.dtstart);
            return eventStart >= startDate && eventStart <= endDate;
        });
    }

    public getEventsBySummary(searchTerm: string): CalendarEvent[] {
        return this.calendarData.events.filter(event => event.summary.toLowerCase().includes(searchTerm.toLowerCase()));
    }
}
