import React, { useState, useEffect } from 'react';
import { Row, Col, ButtonGroup, Button } from 'react-bootstrap';
import moment from 'moment-timezone';
import { CalEventModel } from '../../models/CalEventModel';
import DayViewCard from '../cards/DayViewCard';
import BriefingCard from '../cards/BriefingCard';
import EventDetailsCard from '../cards/EventDetailsCard';
import ChatCard from '../cards/ChatCard';

export default function Home() {

    const [events, setEvents] = useState<CalEventModel[]>([]);
    const [selectedDate, setSelectedDate] = useState<moment.Moment>(moment());
    const [weekDays, setWeekDays] = useState<moment.Moment[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<CalEventModel | null>(null);

    useEffect(() => {
        const events = CalEventModel.getSampleEvents();
        getWeekDays(events);
        setEvents(events);
    }, []);

    // Generate array of weekdays (Monday through Friday) for current week
    const getWeekDays = (events: CalEventModel[]) => {
        const days = [];
        const startOfWeek = moment(events[0].start).startOf('isoWeek'); // ISO week starts on Monday
        for (let i = 0; i < 5; i++) { // Monday through Friday (5 days)
            days.push(startOfWeek.clone().add(i, 'days'));
        }
        setWeekDays(days);
    };

    // Filter events for the selected date
    const getEventsForDate = (date: moment.Moment) => {
        return events.filter(event => {
            return event.start.format('YYYY-MM-DD') === date.format('YYYY-MM-DD');
        });
    };

    const selectedDateEvents = getEventsForDate(selectedDate);

    return (
        <div className="container-fluid mt-4">

            {/* Day Selector */}
            <div className="mb-4 d-flex justify-content-center">
                <ButtonGroup>
                    {weekDays.map((day, index) => (
                        <Button
                            key={index}
                            variant={selectedDate.format('YYYY-MM-DD') === day.format('YYYY-MM-DD') ? 'primary' : 'outline-primary'}
                            onClick={() => setSelectedDate(day)}
                            className="px-3"
                        >
                            <div className="text-center">
                                <div className="fw-bold">{day.format('ddd')}</div>
                                <div className="small">{day.format('M/D')}</div>
                            </div>
                        </Button>
                    ))}
                </ButtonGroup>
            </div>

            {/* Two Column Layout */}
            <Row>
                <Col lg={3} className="mb-4">
                    <DayViewCard 
                        events={selectedDateEvents} 
                        selectedDate={selectedDate}
                        onEventSelect={setSelectedEvent}
                    />
                </Col>
                <Col lg={5} className="mb-4">
                    <BriefingCard events={selectedDateEvents} selectedDate={selectedDate}/>
                </Col>
                <Col lg={4} className="mb-4">
                    <EventDetailsCard calEvent={selectedEvent}/>
                    <ChatCard events={selectedDateEvents} selectedDate={selectedDate}/>
                </Col>                
            </Row>
        </div>
    );
}
