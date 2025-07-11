# GetChief - AI-Powered Calendar Briefing System

A comprehensive daily briefing calendar interface that combines calendar visualization with AI-powered event analysis and background information generation.

## 🎯 Overview

GetChief is a React + TypeScript frontend with Node.js backend that provides:
- **Interactive Calendar View**: Visual day-by-day schedule with time slots
- **AI-Generated Briefings**: Daily summaries powered by Claude AI
- **Event Background Intelligence**: Detailed context and news for individual events
- **Web Search Integration**: Real-time information gathering from news sources

## 🏗️ Architecture

### Frontend (React + TypeScript)
```
src/
├── components/
│   ├── pages/
│   │   └── Home.tsx              # Main application page
│   └── cards/
│       ├── DayViewCard.tsx       # Calendar visualization
│       ├── BriefingCard.tsx      # Daily AI briefing
│       └── EventDetailsCard.tsx  # Individual event analysis
├── models/
│   ├── CalEventModel.ts          # Calendar event data model
│   ├── Agent.ts                  # AI agent wrapper
│   └── BaseModel.ts              # Base API model
```

### Backend (Node.js + Express)
```
src/
├── routes/
│   └── chat-api.ts               # AI chat endpoints
├── services/
│   └── ClaudeHelper.ts           # Anthropic Claude integration
└── utils/
    └── CalReader.ts              # iCal file parser
```

## 🚀 Key Features

### 1. Interactive Calendar Interface
- **Day View**: Time-slotted calendar (6 AM - 11 PM, 30-minute intervals)
- **Event Types**: Color-coded badges (TRAVEL, PRESS, BLOCK, SPEECH, PHONE)
- **All-Day Events**: Separate section overlapping timed events
- **Event Selection**: Click any event for detailed analysis

### 2. AI-Powered Daily Briefings
- **Context-Aware**: Analyzes all events for the selected day
- **Mayor-Focused**: Tailored for executive briefing needs
- **Real-Time Generation**: Updates when date or events change

### 3. Event Background Intelligence
- **Individual Analysis**: Deep-dive into specific meetings/events
- **Entity Extraction**: Identifies people, organizations, locations
- **News Integration**: Finds relevant press coverage and context
- **Confidence Scoring**: AI provides reliability metrics (0-100%)

### 4. Web Search Integration
- **Real-Time Data**: Searches Denver Post, Denver Business Journal, etc.
- **Contextual News**: Finds relevant articles about events and entities
- **Press Coverage**: Identifies recent media mentions

## 🔧 Technical Implementation

### Event Selection Flow
1. **User clicks event** in DayViewCard
2. **Home component** manages selection state
3. **EventDetailsCard** generates AI background analysis
4. **Loading states** provide user feedback during AI processing

### AI Agent System
```typescript
const agent = new Agent({
    name: "Event Background Agent",
    webSearch: true,
    systemContext: "You are an assistant for the Mayor of Denver..."
});

const response = await agent.ask("Analyze this event...");
```

### Calendar Data Model
```typescript
interface CalEventModel {
    uid: string;
    summary: string;
    start: moment.Moment;
    end: moment.Moment;
    location?: string;
    description?: string;
    type: string; // TRAVEL, PRESS, BLOCK, etc.
    status: string; // CONFIRMED, TENTATIVE, etc.
    isAllDay: boolean;
}
```

## 🎨 User Interface

### Layout Structure
- **Left Column (4/12)**: DayViewCard - Visual calendar
- **Right Column (8/12)**: 
  - EventDetailsCard (when event selected)
  - BriefingCard - Daily AI briefing

### Day Selector
- **Monday-Friday**: ISO week standard
- **Button Group**: Easy date navigation
- **Event Filtering**: Shows only events for selected date

### Visual Design
- **Bootstrap Styling**: Responsive, professional appearance
- **Color Coding**: Consistent event type identification
- **Loading States**: Spinners during AI generation
- **Markdown Support**: Rich text formatting for AI content

## 🔌 API Integration

### Claude AI Integration
- **Anthropic SDK**: Direct integration with Claude
- **Web Search Tool**: Real-time information gathering
- **Context Management**: Maintains conversation history
- **Error Handling**: Robust failure recovery

### Endpoints
```
POST /agent/ask
{
    "query": "Analyze this event...",
    "systemContext": "You are an assistant...",
    "history": [...],
    "webSearch": true
}
```

## 📊 Data Flow

1. **Calendar Events**: Sample data or iCal import
2. **Date Selection**: User chooses day from selector
3. **Event Filtering**: Shows events for selected date
4. **Calendar Rendering**: DayViewCard displays visual schedule
5. **Event Selection**: User clicks specific event
6. **AI Analysis**: EventDetailsCard generates background
7. **Daily Briefing**: BriefingCard provides day overview

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 16+
- npm or yarn
- Anthropic API key

### Environment Variables
```bash
# Backend
ANTHROPIC_API_KEY=your_claude_api_key

# Frontend
REACT_APP_API_URL=http://localhost:4374
# or
VITE_API_URL=http://localhost:4374
```

### Installation
```bash
# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm start
```

## 🎯 Use Cases

### Executive Briefings
- **Daily Overview**: Comprehensive day schedule analysis
- **Event Context**: Background on meetings and attendees
- **News Awareness**: Recent developments affecting events

### Meeting Preparation
- **Entity Research**: Information on people and organizations
- **Press Coverage**: Recent media mentions and context
- **Confidence Metrics**: Reliability of information sources

### Schedule Management
- **Visual Planning**: Time-slot calendar view
- **Event Types**: Clear categorization and color coding
- **Conflict Detection**: Overlapping event visualization

## 🔮 Future Enhancements

- **iCal Import**: Direct calendar file integration
- **Multi-Day View**: Week/month calendar layouts
- **Email Integration**: Automatic briefing delivery
- **Custom Agents**: Specialized AI assistants for different roles
- **Analytics Dashboard**: Meeting patterns and insights
- **Mobile Responsive**: Touch-optimized interface

## 📝 Development Notes

### Key Design Decisions
- **ISO Week Standard**: Monday-Friday business week
- **30-Minute Slots**: Optimal calendar granularity
- **AI-First Approach**: Intelligence at the core of user experience
- **Component Modularity**: Reusable, maintainable architecture
- **TypeScript Throughout**: Type safety and developer experience

### Performance Considerations
- **Conditional Rendering**: Only load AI content when needed
- **Loading States**: User feedback during async operations
- **Error Boundaries**: Graceful failure handling
- **Memory Management**: Efficient state updates

---

*Built for executive productivity and intelligent calendar management.*
