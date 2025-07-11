import { Card, Badge, ListGroup } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import type { EventBackground } from './BriefingCard';

interface EventDetailsCardProps {
    eventBackground: EventBackground;
}

export default function EventDetailsCard({ eventBackground }: EventDetailsCardProps) {
    
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

    return (
        <Card className="mb-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">{eventBackground.name}</h6>
                <Badge bg={getConfidenceColor(eventBackground.confidence)}>
                    {eventBackground.confidence}% confidence
                </Badge>
            </Card.Header>
            
            <Card.Body>
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
            </Card.Body>
        </Card>
    );
}