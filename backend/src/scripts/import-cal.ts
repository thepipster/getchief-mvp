import * as ical from "node-ical";
import { CalendarResponse, CalendarComponent, VTimeZone, VCalendar, VEvent, Attendee } from "node-ical";
import { join } from "path";
import { Logger } from "../utils/Logger";
import * as fs from "fs";
import moment, {type Moment} from "moment-timezone";
import { writeFile } from "fs-extra";

/*
  export type AttendeeCUType = 'INDIVIDUAL' | 'UNKNOWN' | 'GROUP' | 'ROOM' | string;
  export type AttendeeRole = 'CHAIR' | 'REQ-PARTICIPANT' | 'NON-PARTICIPANT' | string;
  export type AttendeePartStat = 'NEEDS-ACTION' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE' | 'DELEGATED';

  export type DateWithTimeZone = Date & {tz: string};
  export type DateType = 'date-time' | 'date';
  export type Transparency = 'TRANSPARENT' | 'OPAQUE';
  export type Class = 'PUBLIC' | 'PRIVATE' | 'CONFIDENTIAL';
  export type Method = 'PUBLISH' | 'REQUEST' | 'REPLY' | 'ADD' | 'CANCEL' | 'REFRESH' | 'COUNTER' | 'DECLINECOUNTER';
  export type VEventStatus = 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED';
}
*/

type CalAttendee = {
    email: string,
    name: string,
    response: 'NEEDS-ACTION' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE' | 'DELEGATED',
    role: 'CHAIR' | 'REQ-PARTICIPANT' | 'NON-PARTICIPANT' | string;
    type: 'INDIVIDUAL' | 'UNKNOWN' | 'GROUP' | 'ROOM' | string;
    accepted: boolean,
    declined: boolean,
    responded: boolean
}

type CalEvent = {
    method: string, // 'PUBLISH' | 'REQUEST' | 'REPLY' | 'ADD' | 'CANCEL' | 'REFRESH' | 'COUNTER' | 'DECLINECOUNTER',
    timezone: string,
    uid: string,
    sequence: string,
    transparency: string, // 'TRANSPARENT' | 'OPAQUE',
    class: string, // 'PUBLIC' | 'PRIVATE' | 'CONFIDENTIAL',
    summary: string,
    isAllDay: boolean,
    start: Moment,
    end: Moment,
    location: string,
    description: string,
    url: string,
    completion: string,
    created: Moment,
    lastmodified: Moment,
    //rrule?: RRule;
    attendees?: CalAttendee[],
    attendeeCount?: number,
    attendeeAccepted?: number,
    attendeeDeclined?: number,
    //recurrences?: Record<string, Omit<VEvent, 'recurrences'>>;
    status?: string, // 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED';
    // I am not entirely sure about these, leave them as any for now..
    organizer: string
    //recurrenceid: any;
}

class CalParser {

    private filename: string = "";

    constructor(filename: string) {
        Logger.debug("CalParser constructor called with filename:", filename);
        this.filename = filename;
    }

    public async parseFile(): Promise<void> {
        try {
            // load and parse this file without blocking the event loop
            const data:CalendarResponse = await ical.async.parseFile(this.filename);

            // Extract the evets from the data object
            const rawEvents: VEvent[] = Object.values(data).filter((item): item is VEvent => item.type === 'VEVENT');

            // Sort events by start date
            rawEvents.sort((a, b) => {
                if (a.start && b.start) {
                    return a.start.getTime() - b.start.getTime();
                }
                return 0;
            });

            Logger.debug(`Found ${Object.keys(data).length} events in calendar file ${this.filename}`);

            let events: CalEvent[] = [];

            // Convert to our CalEvent type
            for (let i=0; i<rawEvents.length; i++) {

                const rawEvent:VEvent = rawEvents[i];
                const attendees: CalAttendee[] = [];
                if (rawEvent.attendee) {
                    if (Array.isArray(rawEvent.attendee)) {

                        for (let j = 0; j < rawEvent.attendee.length; j++) {
                            const att: Attendee = rawEvent.attendee[j];

                            // Handle both string and object attendee types
                            if (typeof att === 'string') {
                                // Simple string attendee (just email)
                                attendees.push({
                                    email: att.replace('mailto:', ''),
                                    name: '', // No name available for string attendees
                                    response: 'NEEDS-ACTION', // Default response
                                    role: 'REQ-PARTICIPANT', // Default role
                                    type: 'INDIVIDUAL', // Default type
                                    accepted: false,
                                    declined: false,
                                    responded: false
                                });
                            } else {
                                // Object attendee with properties
                                attendees.push({
                                    email: att.val.replace('mailto:', ''),
                                    name: att.params?.CN || '', // Use optional chaining for safety
                                    response: att.params?.PARTSTAT || 'NEEDS-ACTION',
                                    role: att.params?.ROLE || 'REQ-PARTICIPANT',
                                    type: att.params?.CUTYPE || 'INDIVIDUAL',
                                    accepted: att.params?.PARTSTAT === 'ACCEPTED',
                                    declined: att.params?.PARTSTAT === 'DECLINED',
                                    responded: ['ACCEPTED', 'DECLINED', 'TENTATIVE'].includes(att.params?.PARTSTAT || '')
                                });
                            }
                        }
                    }
                }


                const event:CalEvent = {
                    method: rawEvent.method,
                    timezone: rawEvent.start.tz,
                    uid: rawEvent.uid,
                    sequence: rawEvent.sequence,
                    transparency: rawEvent.transparency,
                    class: rawEvent.class,
                    summary: rawEvent.summary,
                    isAllDay: rawEvent.datetype === 'date',
                    start: moment(rawEvent.start),
                    end: moment(rawEvent.end),
                    location: rawEvent.location,
                    description: rawEvent.description,
                    url: rawEvent.url,
                    completion: rawEvent.completion,
                    created: moment(rawEvent.created),
                    lastmodified: moment(rawEvent.lastmodified),
                    attendees,
                    status: rawEvent.status,
                    organizer: typeof rawEvent.organizer === 'string' ? rawEvent.organizer : JSON.stringify(rawEvent.organizer),
                }

                Logger.debug('UID:', event.uid);
                Logger.debug(event);
                Logger.warn(rawEvent)

                events.push(event);

                //Logger.debug('Summary:', event.summary);
                //Logger.debug('Original start:', event.start);
                //Logger.debug('Original start:', moment(event.start).format("dddd, Do h:mm:ss a"));
                //Logger.debug('Timezone:', event.start.getTimezoneOffset());
                //Logger.debug('All Day Event:', event.datetype === 'date');
                //if (event.rrule) {
                //    Logger.info(event);
                //}
                //Logger.debug('RRule start:', `${event.rrule.origOptions.dtstart} [${event.rrule.origOptions.tzid}]`)


                /*
                if (!Object.prototype.hasOwnProperty.call(data, k)) continue;

                const event = data[k];
                if (event.type !== 'VEVENT' || !event.rrule) continue;

                const dates = event.rrule.between(new Date(2021, 0, 1, 0, 0, 0, 0), new Date(2021, 11, 31, 0, 0, 0, 0))
                if (dates.length === 0) continue;

                Logger.debug('Summary:', event.summary);
                Logger.debug('Original start:', event.start);
                Logger.debug('RRule start:', `${event.rrule.origOptions.dtstart} [${event.rrule.origOptions.tzid}]`)

                dates.forEach(date => {
                    let newDate
                    if (event.rrule && event.rrule.origOptions.tzid) {
                        // tzid present (calculate offset from recurrence start)
                        const dateTimezone = moment.tz.zone('UTC')
                        const localTimezone = moment.tz.guess()
                        const tz = event.rrule.origOptions.tzid === localTimezone ? event.rrule.origOptions.tzid : localTimezone
                        const timezone = moment.tz.zone(tz)

                        if (timezone && dateTimezone) {
                            // Use getTime() to convert Date to timestamp (number)
                            const timestamp = date.getTime()
                            const offset = timezone.utcOffset(timestamp) - dateTimezone.utcOffset(timestamp)
                            newDate = moment(date).add(offset, 'minutes').toDate()
                        } else {
                            // Fallback if timezone lookup fails
                            newDate = date
                        }
                    } else {
                        // tzid not present (calculate offset from original start)
                        newDate = new Date(date.setHours(date.getHours() - ((event.start.getTimezoneOffset() - date.getTimezoneOffset()) / 60)))
                    }
                    const start = moment(newDate)
                    Logger.debug('Recurrence start:', start)
                })
                    */

                Logger.debug('-----------------------------------------------------------------------------------------');
            }

            fs.writeFileSync(join(__dirname, "../sample-data/cal-clean.json"), JSON.stringify(events, null, 4));

        } catch (error) {
            Logger.error("Error parsing iCal file:", error);
            throw error;
        }

    }

}

setTimeout(async () => {

    // Use direct path since this script is in src/scripts/
    const parser: CalParser = new CalParser(join(__dirname, "../sample-data/test-gmail-cal.ics"));

    // load and parse this file without blocking the event loop
    await parser.parseFile();

}, 200);
