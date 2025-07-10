
import moment, {type Moment} from "moment-timezone";
import { SampleEvents } from "./cal-data";

export type CalAttendee = {
    email: string,
    name: string,
    response: string, // 'NEEDS-ACTION' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE' | 'DELEGATED',
    role: string, // 'CHAIR' | 'REQ-PARTICIPANT' | 'NON-PARTICIPANT' | string;
    type: string, // 'INDIVIDUAL' | 'UNKNOWN' | 'GROUP' | 'ROOM' | string;
    accepted: boolean,
    declined: boolean,
    responded: boolean
}

export type CalEvent = {
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
    type: string, // TRAVEL, PRESS, BLOCK, SPEECH, PHONE
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

export class CalEventModel {

    method: string = ""; // 'PUBLISH' | 'REQUEST' | 'REPLY' | 'ADD' | 'CANCEL' | 'REFRESH' | 'COUNTER' | 'DECLINECOUNTER';
    uid: string = "";
    sequence: string = "";
    transparency: string = "OPAQUE"; // 'TRANSPARENT' | 'OPAQUE'
    class: string = "PUBLIC"; // 'PUBLIC' | 'PRIVATE' | 'CONFIDENTIAL'
    summary: string = "";
    isAllDay: boolean = false;
    start: Moment = moment();
    end: Moment = moment();
    location: string = "";
    description: string = ""
    url: string = "";
    completion: string = "";
    created: Moment = moment();
    modified: Moment = moment();
    type: string = "EVENT";
    //rrule?: RRule;
    //organizer: string = ""; // email of organizer
    attendee: CalAttendee[] = []; // list of attendees
    attendeeCount: number = 0; // number of attendees invited
    attendeeAccepted: number = 0; // number of attendees accepted
    attendeeDeclined: number = 0; // number of attendees declined
    status: string = "TENTATIVE"; // 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED'
    timezone: string = moment.tz.guess();

    constructor(event?: CalEvent) {
        if (event) {
            this.method = event.method || "";
            this.uid = event.uid || "";
            this.sequence = event.sequence || "";
            this.transparency = event.transparency || "OPAQUE";
            this.class = event.class || "PUBLIC";
            this.summary = event.summary || "";
            this.isAllDay = event.isAllDay || false;
            this.start = event.start || moment();
            this.end = event.end || moment();
            this.location = event.location || "";
            this.description = event.description || "";
            this.url = event.url || "";
            this.completion = event.completion || "";
            this.created = event.created || moment();
            this.modified = event.lastmodified || moment();
            this.attendee = event.attendees || [];
            this.attendeeCount = event.attendeeCount || 0;
            this.attendeeAccepted = event.attendeeAccepted || 0;
            this.attendeeDeclined = event.attendeeDeclined || 0;
            this.status = event.status || "TENTATIVE";
            this.timezone = event.timezone || moment.tz.guess();
            this.type = event.type || "EVENT";
        }
    }

    // Extract event type from summary
    static getEventType(summary: string) {
        if (summary.includes('Phone Call')) return 'PHONE';
        const match = summary.match(/\[([^\]]+)\]/);
        return match ? match[1] : 'EVENT';
    };

    static removeEventType(summary: string) {
        return summary.replace(/\[([^\]]+)\]/, '');
    }
    static getSampleEvents(): CalEventModel[] {

        let evts: CalEventModel[] = [];

        for (let i=0; i<SampleEvents.length; i++) {
            const attendees = SampleEvents[i].attendees as CalAttendee[];
            const attendeeCount = attendees.length;
            const attendeeAccepted = attendees.filter(a => a.response === 'ACCEPTED').length;
            const attendeeDeclined = attendees.filter(a => a.response === 'DECLINED').length;
            const eventType: string = CalEventModel.getEventType(SampleEvents[i].summary);
            const tmp: CalEvent = {
                method: SampleEvents[i].method,
                timezone: SampleEvents[i].timezone || "",
                uid: SampleEvents[i].uid,
                sequence: SampleEvents[i].sequence,
                transparency: SampleEvents[i].transparency,
                class: "PUBLIC", // Default value since not in sample data
                summary: CalEventModel.removeEventType(SampleEvents[i].summary),
                isAllDay: SampleEvents[i].isAllDay,
                start: moment(SampleEvents[i].start),
                end: moment(SampleEvents[i].end),
                location: SampleEvents[i].location || "",
                description: SampleEvents[i].description || "",
                url: "", // Not in sample data
                completion: "", // Not in sample data
                type: eventType,
                created: moment(SampleEvents[i].created),
                lastmodified: moment(SampleEvents[i].lastmodified),
                attendees: attendees,
                attendeeCount: attendeeCount,
                attendeeAccepted: attendeeAccepted,
                attendeeDeclined: attendeeDeclined,
                status: SampleEvents[i].status,
                organizer: SampleEvents[i].organizer || ""
            }

            console.log(tmp);
            evts.push(new CalEventModel(tmp));
        }
        return evts;
    }
}
