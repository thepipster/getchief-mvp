import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import moment from 'moment-timezone';
import { CalEventModel } from '../../models/CalEventModel';

interface BriefingCardProps {
    events: CalEventModel[];
    selectedDate: moment.Moment;
}

export default function BriefingCard({ events }: BriefingCardProps) {
    
    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => 
        moment(a.start).valueOf() - moment(b.start).valueOf()
    );

    // Get event type color
    const getEventTypeColor = (type: string) => {
        if (type === 'TRAVEL') return 'warning';
        if (type === 'PRESS') return 'info';
        if (type === 'BLOCK') return 'secondary';
        if (type === 'SPEECH') return 'success';
        if (type === 'PHONE') return 'danger';
        return 'primary';
    };

    return (
        <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Daily Briefing</h5>
                <Badge bg="light" text="dark">{events.length} events</Badge>
            </Card.Header>
            <Card.Body style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {sortedEvents.length === 0 ? (
                    <div className="text-center text-muted p-4">
                        <p>No events scheduled for this day</p>
                        <small>Enjoy your free time!</small>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-3">
                        {sortedEvents.map((event, index) => (
                            <div key={index} className="border rounded p-3">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div className="flex-grow-1">
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            <Badge bg={getEventTypeColor(event.type)} className="small">
                                                {event.type}
                                            </Badge>    
                                            <span className="fw-bold">
                                                {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
                                            </span>
                                        </div>
                                        <h6 className="mb-1">
                                            {event.summary.replace(/\[[^\]]+\]\s*/, '')}
                                        </h6>
                                    </div>
                                    <Badge 
                                        bg={event.status === 'CONFIRMED' ? 'success' : 'warning'} 
                                        className="ms-2"
                                    >
                                        {event.status}
                                    </Badge>
                                </div>
                                
                                {event.location && (
                                    <div className="text-muted small mb-2">
                                        <i className="bi bi-geo-alt"></i> {event.location}
                                    </div>
                                )}
                                
                                {event.description && (
                                    <div className="text-muted small mb-2">
                                        {event.description.length > 100 
                                            ? event.description.substring(0, 100) + '...' 
                                            : event.description
                                        }
                                    </div>
                                )}
                                
                                {event.attendee.length > 0 && (
                                    <div className="small">
                                        <span className="text-muted">Attendees: </span>
                                        <Badge bg="light" text="dark">{event.attendeeCount}</Badge>
                                        {event.attendeeAccepted > 0 && (
                                            <Badge bg="success" className="ms-1">{event.attendeeAccepted} accepted</Badge>
                                        )}
                                        {event.attendeeDeclined > 0 && (
                                            <Badge bg="danger" className="ms-1">{event.attendeeDeclined} declined</Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}
