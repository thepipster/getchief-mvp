import * as dotenv from "dotenv";
import express, { Application, ErrorRequestHandler } from 'express';
import "express-async-errors";
import http from 'http';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import { Logger } from './utils/Logger';
import { ChatAPI } from './routes/chat-api';

// Setup config
dotenv.config();

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

app.post('/agent/ask', ChatAPI.askAgent);

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
