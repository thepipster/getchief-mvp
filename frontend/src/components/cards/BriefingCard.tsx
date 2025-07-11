import { Card, Badge, Spinner } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import moment from 'moment-timezone';
import { CalEventModel } from '../../models/CalEventModel';
import { Agent} from "../../models/Agent";
import ReactMarkdown from 'react-markdown';
import EventDetailsCard from './EventDetailsCard';
interface BriefingCardProps {
    events: CalEventModel[];
    selectedDate: moment.Moment;
}

export type EventBackground = {
    event?: CalEventModel;
    background: string;
    name: string;
    confidence: number;
    news: string;
    entities?: [
        {
            name: string,
            type: string,
        }
    ]
};

export default function BriefingCard({ events, selectedDate }: BriefingCardProps) {
    


    const [briefing, setBriefing] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
    const [eventBackground, setEventBackground] = useState<EventBackground[]>([]);    
    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => 
        moment(a.start).valueOf() - moment(b.start).valueOf()
    );

    // Create an instance of each agent we want to use;
    const briefingBot = new Agent({
        name: "Briefing Agent", 
        systemContext: `You are a assistant for the Mayor of the City of Denver. 
You are given a list of events for the day and your task is to create a briefing for the mayor. Provide an executive summary and a detailed briefing. 
Identify key people, organizations, and locations from the events and provide advice.`
    });

    const eventBackgroundBot = new Agent({
        name: "Event Background Agent", 
        systemContext: `You are a assistant for the Mayor of the City of Denver. You are given the details of a single event and your task is to provide 
        background information about the event. Extract entities from the event description such as people, organizations, and locations. Attempt to find
        any relevant press clippings and other information about the event from the day before (from press sources). You return all results in JSON format 
        with the following keys; {
            "name": "Event name",
            "background": "Event background information",
            "confidence": "A confidence level from 0 to 100 in this event information",
            "news": "Topical news related to this event from press sources based on today's date",
            "entities": [
                {
                    "name": "Entity name",
                    "type": "Person | Organization | Location"
                }
            ]   
        }`
    });

    /*

{
    "executiveSummary": "The executive summary",
    "briefing": "The briefing text",
    "keyPeople": "The key people",
    "keyOrganizations": "The key organizations",
    "events": [
        {
            "name": "Event name",
            "description": "Event description",
            "context": "Event context",
            "entities": [
                {
                    "name": "Entity name",
                    "description": "Entity description",
                    "context": "Entity context",
                    "topicalNews": "Topical news related to this entity from press sources based on today's date"
                }
            ]
        }
    ]
}`
    });
*/


    function createContext(): string {
        let context = "";
        for (let i=0; i<sortedEvents.length; i++) {
            const event: CalEventModel = sortedEvents[i];
            context += JSON.stringify(event);
            /*
            context += "";
            context += event.summary + "\n";
            if (event.description) {
                context += event.description + "\n";
            }
                */
            context += "\n";
        }
        return context;
    }

    async function updateEventBackgrounds(){
        setIsLoadingDetails(true);
        try {
            if (sortedEvents.length === 0) {
                setEventBackground([]);
                return;
            }
            let resp:string = await eventBackgroundBot.ask(`Please provide background information on the following event: ${JSON.stringify(sortedEvents[0])}`);
            console.log(sortedEvents[0].summary,resp);

            resp = resp.replace('```json', '');
            resp = resp.replace('```', '');
                        
            const eventBackground: EventBackground = JSON.parse(resp);
            setEventBackground([eventBackground]);
        } catch (error) {
            console.error('Error generating briefing:', error);
            setEventBackground(['Error generating briefing. Please try again.']);
        } finally {
            setIsLoadingDetails(false);
        }
    }

    async function updateBrief(){
        setIsLoading(true);
        try {
            if (sortedEvents.length === 0) {
                setBriefing("No events scheduled for this day");
                return;
            }
            /*
            const briefing = await briefingBot.ask(`Please create a briefing for the mayor. 
The events for the day are: ${createContext()}`);
            setBriefing(briefing);
            */
            updateEventBackgrounds();
        } catch (error) {
            console.error('Error generating briefing:', error);
            setBriefing('Error generating briefing. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        updateBrief();
    }, [selectedDate, events]);

    return (
        <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Daily Briefing</h5>
                <Badge bg="light" text="dark">{events.length} events</Badge>
            </Card.Header>
            <Card.Body style={{ maxHeight: '600px', overflowY: 'auto' }} className="h-100">
                {isLoading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                        <div className="text-center">
                            <Spinner animation="border" role="status" className="mb-2">
                                <span className="visually-hidden">Loading...</span>
                            </Spinner>
                            <div className="text-muted">Generating briefing...</div>
                        </div>
                    </div>
                ) : (
                    <ReactMarkdown>{briefing}</ReactMarkdown>
                )}
                {isLoadingDetails ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                        <div className="text-center">
                            <Spinner animation="border" role="status" className="mb-2">
                                <span className="visually-hidden">Loading...</span>
                            </Spinner>
                            <div className="text-muted">Generating event details...</div>
                        </div>
                    </div>
                ) : (
                 <hr/>
                )}

                {eventBackground.map((deets, index) => (
                    <EventDetailsCard key={index} eventBackground={deets} />
                ))}
            </Card.Body>
        </Card>
    );
}
