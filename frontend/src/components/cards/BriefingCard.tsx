import { Card, Badge, Spinner } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import moment from 'moment-timezone';
import { CalEventModel } from '../../models/CalEventModel';
import { Agent} from "../../models/Agent";
import ReactMarkdown from 'react-markdown';

interface BriefingCardProps {
    events: CalEventModel[];
    selectedDate: moment.Moment;
}

// Create an instance of each agent we want to use;
export const briefingBot = new Agent({
    name: "Briefing Agent", 
    systemContext: `You are a assistant for the Mayor of the City of Denver. 
You are given a list of events for the day and your task is to create a briefing for the mayor. Provide an executive summary and a detailed briefing. 
Identify key people, organizations, and locations from the events and provide advice. You do not need to provide a list of events.`
});


export default function BriefingCard({ events, selectedDate }: BriefingCardProps) {
    
    const [briefing, setBriefing] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => 
        moment(a.start).valueOf() - moment(b.start).valueOf()
    );


    function createContext(): string {
        let context = "";
        for (let i=0; i<sortedEvents.length; i++) {
            const event: CalEventModel = sortedEvents[i];
            context += event.getContext();
            context += "\n";
        }
        return context;
    }

    async function updateBrief(){
        setIsLoading(true);
        try {
            if (sortedEvents.length === 0) {
                setBriefing("No events scheduled for this day");
                return;
            }            
            const briefing = await briefingBot.ask(`Please create a briefing for the mayor. 
The events for the day are provided below:`, createContext());
            setBriefing(briefing);
        } catch (error) {
            console.error('Error generating briefing:', error);
            setBriefing('Error generating briefing. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    // Called if the selected date changes
    useEffect(() => {
        briefingBot.clearHistory();        
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
            </Card.Body>
        </Card>
    );
}
