import React, { useState, useEffect } from 'react';
import { Row, Col, ButtonGroup, Button } from 'react-bootstrap';
import moment from 'moment-timezone';
import { CalEventModel } from '../../models/CalEventModel';
import DayViewCard from '../cards/DayViewCard';
import BriefingCard from '../cards/BriefingCard';

export default function Home() {

    const [events, setEvents] = useState<CalEventModel[]>([]);
    const [selectedDate, setSelectedDate] = useState<moment.Moment>(moment());

    useEffect(() => {
        const events = CalEventModel.getSampleEvents();
        setEvents(events);
    }, []);

    // Generate array of weekdays (Monday through Friday) for current week
    const getWeekDays = () => {
        const days = [];
        const startOfWeek = moment().startOf('isoWeek'); // ISO week starts on Monday
        for (let i = 0; i < 5; i++) { // Monday through Friday (5 days)
            days.push(startOfWeek.clone().add(i, 'days'));
        }
        return days;
    };

    const weekDays = getWeekDays();

    // Filter events for the selected date
    const getEventsForDate = (date: moment.Moment) => {
        return events.filter(event => {
            return event.start.format('YYYY-MM-DD') === date.format('YYYY-MM-DD');
        });
    };

    const selectedDateEvents = getEventsForDate(selectedDate);

    return (
        <div className="container-fluid mt-4">
            <h1 className="mb-4 text-center">Daily Briefing</h1>

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
                <Col lg={8} className="mb-4">
                    <DayViewCard events={selectedDateEvents} selectedDate={selectedDate}/>
                </Col>
                <Col lg={4} className="mb-4">
                    <BriefingCard events={selectedDateEvents} selectedDate={selectedDate}/>
                </Col>
            </Row>
        </div>
    );
}
