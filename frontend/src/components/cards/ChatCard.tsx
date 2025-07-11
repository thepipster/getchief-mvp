import React, { useState, useRef, useEffect } from 'react';
import { Button, Form, Card, Spinner, Badge } from 'react-bootstrap';
import { Agent, type AgentMessage } from '../../models/Agent';
import ReactMarkdown from 'react-markdown';
import { CalEventModel } from '../../models/CalEventModel';
import moment from 'moment-timezone';

interface ChatCardProps {
    selectedDate: moment.Moment;
    events: CalEventModel[];
}


export default function ChatCard({ selectedDate, events }: ChatCardProps) {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<AgentMessage[]>([]);

    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => 
        moment(a.start).valueOf() - moment(b.start).valueOf()
    );

    // Create an instance of each agent we want to use;
    const chatBot = new Agent({
        name: "Chat Agent", 
        systemContext: `You are a assistant for the Mayor of the City of Denver. You are given a list of events for the day and your task is to answer 
    questions about the events and entities, and provide advice.`
    });

    useEffect(() => {   
        chatBot.clearHistory();
//        chatBot.setSystemContext(`You are a assistant for the Mayor of the City of Denver. You are given a list of events for the day 
//and your task is to answer questions about the events and entities, and provide advice. The day's events are: \n${createContext()}`);
    }, [selectedDate]);

    // Initialize with a welcome message
    useEffect(() => {


        setMessages([
            {
                role: 'assistant',
                content: 'Welcome to the AI Assistant! Select a day first, and then we can chat about your schedule.',
            },
        ]);

    }, []);

    function createContext(): string {
        let context = "";
        for (let i=0; i<sortedEvents.length; i++) {
            const event: CalEventModel = sortedEvents[i];
            context += event.getContext();
            context += "\n";
        }
        return context;
    }
    const handleSubmit = async (e: React.FormEvent) => {
        
        e.preventDefault();
        if (!input.trim()) return;

        // Add user message to chat
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            await chatBot.ask(input, createContext());
            setMessages(chatBot.getChatHistory());
        } catch (err) {
            console.error('Error sending message:', err);
            setError('Failed to send message. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="chat-container">
            <Card.Header>
                Chat
            </Card.Header>

            <Card.Body className="p-0">
                <div className="p-3">
                    <div className="d-flex align-items-end flex-column h-100" style={{ overflowY: 'auto' }}>
                        {messages.map((msg: AgentMessage, index: number) => (
                            <div
                                key={index}
                                className={`message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
                                style={{
                                    marginBottom: '10px',
                                    padding: '8px 12px',
                                    borderRadius: '12px',
                                    backgroundColor: msg.role === 'user' ? '#007bff' : '#f1f1f1',
                                    color: msg.role === 'user' ? 'white' : 'black',
                                    maxWidth: '80%',
                                    display: 'inline-block',
                                }}
                            >
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />

                        {error && <div className="alert alert-danger mt-3">{error}</div>}

                        <div className="mt-auto w-100">
                            <hr />
                            <Form onSubmit={handleSubmit}>
                                <div className="d-flex">
                                    <Form.Control
                                        type="text"
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        placeholder="Type your message..."
                                        disabled={isLoading}
                                    />
                                    <Button type="submit" disabled={isLoading || !input.trim()} className="ms-2">
                                        {isLoading ? <Spinner animation="border" size="sm" /> : 'Send'}
                                    </Button>
                                </div>
                            </Form>
                        </div>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}
