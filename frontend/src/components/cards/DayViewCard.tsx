
import { Card, Badge } from 'react-bootstrap';
import moment from 'moment-timezone';
import { CalEventModel } from '../../models/CalEventModel';

interface DayViewCardProps {
    events: CalEventModel[];
    selectedDate: moment.Moment;
    onEventSelect?: (event: CalEventModel) => void;
}

export default function DayViewCard({ events, selectedDate, onEventSelect }: DayViewCardProps) {

    // Separate all-day events from timed events
    const allDayEvents = events.filter(event => event.isAllDay);
    const timedEvents = events.filter(event => !event.isAllDay);

    // Generate time slots for the day (6 AM to 11 PM in 30-minute intervals)
    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 6; hour <= 23; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = moment().hour(hour).minute(minute).second(0);
                slots.push(time);
            }
        }
        return slots;
    };

    const timeSlots = generateTimeSlots();

    // Function to calculate event height based on duration
    const getEventHeight = (event: CalEventModel) => {
        const duration = moment(event.end).diff(moment(event.start), 'minutes');
        const slots = Math.ceil(duration / 30);
        return slots * 60 - 10; // 60px per slot minus margin
    };

    // Function to get event position
    const getEventPosition = (event: CalEventModel) => {
        const eventStart = moment(event.start);
        const dayStart = moment(selectedDate).hour(6).minute(0).second(0);
        const minutesFromStart = eventStart.diff(dayStart, 'minutes');
        return (minutesFromStart / 30) * 60; // 60px per 30-minute slot
    };

    const getEventBackgroundColor = (type: string) => {
        if (type === 'TRAVEL') return 'bg-warning border border-warning text-white';
        if (type === 'PRESS') return 'bg-info border border-info text-white';
        if (type === 'BLOCK') return 'bg-transparent border border-primary text-primary';
        if (type === 'SPEECH') return 'bg-success border border-success text-white';
        //if (type === 'PHONE') return 'bg-danger border border-primary text-white';
        return 'bg-primary border border-primary text-white';
    };
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
        <Card className="h-100" style={{ maxHeight: '100vh', overflowY: 'auto' }}>
            
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Schedule</h5>
                <span className="text-muted">{selectedDate.format('dddd, MMMM Do, YYYY')}</span>
            </Card.Header>

            <Card.Body className="p-0" style={{ height: "100%", overflowY: 'auto' }}>
                {/* All-day events section */}
                {allDayEvents.length > 0 && (
                    <div className="border-bottom" style={{ backgroundColor: '#f8f9fa' }}>
                        <div className="d-flex">
                            <div className="text-muted small p-2 border-end fw-bold" style={{ width: '80px', fontSize: '0.75rem' }}>
                                All Day
                            </div>
                            <div className="flex-grow-1 p-2">
                                {allDayEvents.map((event, index) => (
                                    <div
                                        key={`allday-${index}`}
                                        className="rounded p-2 mb-1 text-white small"
                                        style={{
                                            backgroundColor: event.status === 'CONFIRMED' ? '#198754' : '#6c757d',
                                            fontSize: '0.8rem',
                                            cursor: onEventSelect ? 'pointer' : 'default'
                                        }}
                                        onClick={() => onEventSelect?.(event)}
                                    >
                                        <div className="fw-bold">{event.summary}</div>
                                        {event.location && (
                                            <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                                                📍 {event.location}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="position-relative" style={{ minHeight: '1080px' }}>
                    {/* Time slots grid */}
                    {timeSlots.map((slot, index) => (
                        <div
                            key={index}
                            className="d-flex border-bottom"
                            style={{ height: '60px', minHeight: '60px' }}
                        >
                            <div
                                className="text-muted small p-2 border-end"
                                style={{ width: '80px', fontSize: '0.75rem' }}
                            >
                                {slot.format('h:mm A')}
                            </div>
                            <div className="flex-grow-1 position-relative">
                                {/* Grid line */}
                                <div className="w-100 h-100"></div>
                            </div>
                        </div>
                    ))}

                    {/* Timed events overlay */}
                    <div className="position-absolute" style={{ top: 0, left: '80px', right: 0, bottom: 0 }}>
                        {timedEvents.map((event, index) => {
                            const top = getEventPosition(event);
                            const height = getEventHeight(event);

                            // Skip events that are outside our time range
                            if (top < 0 || top > 1080) return null;

                            return (
                                <div
                                    key={`timed-${index}`}
                                    className={`position-absolute rounded p-2 m-1 small ${getEventBackgroundColor(event.type)}`}
                                    style={{
                                        top: `${Math.max(0, top)}px`,
                                        height: `${height}px`,
                                        left: '4px',
                                        right: '4px',
                                        zIndex: 10,
                                        overflow: 'hidden',
                                        cursor: onEventSelect ? 'pointer' : 'default'
                                    }}
                                    onClick={() => onEventSelect?.(event)}
                                >
                                    <Badge bg={getEventTypeColor(event.type)} className="small float-end">
                                       {event.type}
                                    </Badge>                                    
                                    <div className="fw-bold" style={{ fontSize: '0.8rem' }}>
                                        {event.summary}
                                    </div>
                                    {/*<div style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                                        {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
                                    </div>*/}
                                    {event.location && (
                                        <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                                            📍 {event.location.length > 30 ? event.location.substring(0, 30) + '...' : event.location}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {events.length === 0 && (
                    <div className="text-center text-muted p-4">
                        <p>No events scheduled for this day</p>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}
