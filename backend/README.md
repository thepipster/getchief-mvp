# Meeting Analyzer - Node.js Backend

This is the Node.js implementation of the Meeting Analyzer backend. It provides the same functionality as the Python backend but implemented using Node.js and Express.

## Features

- Real-time audio and video processing
- Speaker diarization using AWS Transcribe
- Speech-to-text transcription using AWS Bedrock
- Facial emotion detection using AWS Rekognition
- Audio-based emotion detection
- WebSocket communication for real-time updates
- REST API for file uploads and processing

## Prerequisites

- Node.js 14+
- npm or yarn
- AWS account with access to Bedrock, Transcribe, and Rekognition services

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with your AWS credentials:
   ```
   # AWS Credentials
   AWS_ACCESS_KEY_ID=your_aws_access_key_here
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
   AWS_REGION=us-east-1
   
   # AWS Bedrock Configuration
   # For text generation (Claude model)
   AWS_BEDROCK_TEXT_MODEL_ID=anthropic.claude-3-sonnet-20240229
   # For speech-to-text (Amazon Titan model)
   AWS_BEDROCK_SPEECH_MODEL_ID=amazon.titan-speech-1
   
   # Server configuration
   PORT=8000
   HOST=0.0.0.0
   ```

3. Start the server:
   ```
   npm start
   ```
   
   For development with auto-reload:
   ```
   npm run dev
   ```

## API Endpoints

- `POST /upload` - Upload and process audio files

## WebSocket Events

### Client to Server
- `audioChunk` - Send audio chunk for processing
- `imageData` - Send image data for facial emotion detection

### Server to Client
- `transcriptionResult` - Transcription results with speaker and emotion data
- `emotionResult` - Facial emotion detection results
- `error` - Error messages

## AWS Services Integration

- **AWS Bedrock** - Used for speech-to-text transcription
- **AWS Transcribe** - Used for speaker diarization
- **AWS Rekognition** - Used for facial emotion detection

## Implementation Notes

- The backend creates a temporary directory for storing audio chunks
- WebSocket communication is handled using Socket.io
- The server can serve the React frontend if the build directory exists
- Audio processing includes transcription, speaker diarization, and emotion detection
- Facial emotion detection maps AWS emotion types to application-specific types
