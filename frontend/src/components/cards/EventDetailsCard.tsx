import { Card, Badge, ListGroup, Spinner } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import { Agent} from "../../models/Agent";
import { useState, useEffect } from 'react';
import { CalEventModel } from '../../models/CalEventModel';

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

export default function EventDetailsCard({ calEvent }: {calEvent: CalEventModel | null}) {
    
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [eventBackground, setEventBackground] = useState<EventBackground>({
        background: '',
        name: '',
        confidence: 0,
        news: ''
    });    

    const eventBackgroundBot = new Agent({
        name: "Event Background Agent", 
        webSearch: false,
        systemContext: `You are a assistant for the Mayor of the City of Denver. You are given the details of a single event and your task is to provide 
        background information about the event. Extract entities from the event description such as people, organizations, and locations. Attempt to find
        any relevant press clippings and other information about the event (from press sources suc as the Denver Post, Denver Business Journal, etc). You return all results in JSON format 
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
    
    async function updateBrief(){
        setIsLoading(true);
        try {
            // We don't need to remember the chat history for this
            eventBackgroundBot.clearHistory();
            let resp:string = await eventBackgroundBot.ask(`Please provide background information on the following event: ${JSON.stringify(calEvent)}`);

            console.log(resp)
            resp = resp.replace('```json', '');
            resp = resp.replace('```', '');
                        
            const briefing: EventBackground = JSON.parse(resp);
            setEventBackground(briefing);
        } catch (error) {
            console.error('Error generating briefing:', error);
        } finally {
            setIsLoading(false);
        }
    }
        
    useEffect(() => {
        updateBrief();
    }, [calEvent]);    
    
    // Get confidence level color based on score
    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 80) return 'success';
        if (confidence >= 60) return 'warning';
        return 'danger';
    };

    // Get entity type color
    const getEntityTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'person': return 'primary';
            case 'organization': return 'info';
            case 'location': return 'secondary';
            default: return 'light';
        }
    };

    // Show empty state if no event is selected
    if (!calEvent) {
        return (
            <Card className="mb-3">
                <Card.Header>
                    <h6 className="mb-0">Event Details</h6>
                </Card.Header>
                <Card.Body>
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                        <div className="text-center text-muted">
                            <i className="bi bi-calendar-event" style={{ fontSize: '2rem' }}></i>
                            <div className="mt-2">Select an event to view details</div>
                            <small>Click on any event in the calendar to see AI-generated background information</small>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="mb-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">{eventBackground.name || calEvent.summary}</h6>
                <Badge bg={getConfidenceColor(eventBackground.confidence)}>
                    {eventBackground.confidence}% confidence
                </Badge>
            </Card.Header>
            
            <Card.Body>


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
                    <>
                        {/* Background Information */}
                        {eventBackground.background && (
                            <div className="mb-3">
                                <h6 className="text-muted mb-2">Background</h6>
                                <div className="small">
                                    <ReactMarkdown>{eventBackground.background}</ReactMarkdown>
                                </div>
                            </div>
                        )}

                        {/* Related News */}
                        {eventBackground.news && (
                            <div className="mb-3">
                                <h6 className="text-muted mb-2">Related News</h6>
                                <div className="small">
                                    <ReactMarkdown>{eventBackground.news}</ReactMarkdown>
                                </div>
                            </div>
                        )}

                        {/* Entities */}
                        {eventBackground.entities && eventBackground.entities.length > 0 && (
                            <div className="mb-3">
                                <h6 className="text-muted mb-2">Key Entities</h6>
                                <ListGroup variant="flush">
                                    {eventBackground.entities.map((entity, index) => (
                                        <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center px-0 py-2">
                                            <span className="small">{entity.name}</span>
                                            <Badge bg={getEntityTypeColor(entity.type)} className="small">
                                                {entity.type}
                                            </Badge>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </div>
                        )}
                    </>
                )}



            </Card.Body>
        </Card>
    );
}