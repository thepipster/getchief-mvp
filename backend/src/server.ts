import {setupConfig} from './config';
import express, { Application, ErrorRequestHandler } from 'express';
import "express-async-errors";
import http from 'http';
import cors from 'cors';
import * as path from 'path';
import * as fs from 'fs-extra';
import fileUpload from 'express-fileupload';
import VideoAPI from './routes/video-api';
import { domainService } from './routes/domain';
import { agentService } from './routes/agent';
import { Logger } from './utils/Logger';

// Setup config
setupConfig();

// Create Express app
const app: Application = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(fileUpload({
    createParentPath: true,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size
}));

// Create temp directory for audio files
const tempDir: string = path.join(__dirname, 'temp');
fs.ensureDirSync(tempDir);

// Serve static files from React build
const frontendBuildPath = path.join(__dirname, '../frontend/build');
if (fs.existsSync(frontendBuildPath)) {
    app.use(express.static(frontendBuildPath));
} else {
    Logger.info('Frontend build directory not found. Running in API-only mode.');
}

// REST API endpoints for audio and video processing

// Process image for emotion detection
app.post('/video', VideoAPI.getEmotion);

// Chatbot endpoint
//app.post('/chatbot', ChatbotAPI.processMessage);

// Domain API Routes
app.use('/domain', domainService);

// Agent API Routes
app.use('/agent', agentService);

// Define error handling middleware
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    Logger.error(`Unknown Error type: [${req.method}] ${req.originalUrl}, ${err.toString()}`, err);
    res.status(500).send(err.toString());
};

// Register error handling middleware
app.use(errorHandler);

// Start server
const PORT: number = parseInt(process.env.PORT || '8000', 10);
server.listen(PORT, () => {
    Logger.info(`Server running on port ${PORT}`);
});

export default app;
