import { Request, Response } from 'express';
import { RekognitionClient, DetectFacesCommand } from '@aws-sdk/client-rekognition';
import {Logger} from '../utils/Logger';
import { AwsClientFactory } from "../utils/AwsClientFactory";


export default class VideoAPI {

    private static rekognitionClient: RekognitionClient;

    // Process image for emotion detection
    static async getEmotion(req: Request, res: Response): Promise<any> {

        // Create AWS Rekognition client
        const creds = await AwsClientFactory.getClient();
         
        VideoAPI.rekognitionClient = new RekognitionClient({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: creds.AccessKeyId,
                secretAccessKey: creds.SecretAccessKey,
                sessionToken: creds.SessionToken,
            }
        });     
        
        // Check if image data is provided in the request body
        if (!req.body || !req.body.image) {
            return res.status(400).json({ error: 'No image data provided' });
        }

        const { image } = req.body;

        // Convert base64 to buffer
        const imageBuffer = Buffer.from(image.split(',')[1], 'base64');

        // Detect emotions from the image
        const emotions = await VideoAPI.detectEmotionFromImage(imageBuffer);

        // Return results to client
        res.json({
            success: true,
            emotions
        });
        
    }

    // Process image for emotion detection
    static async getFaces(req: Request, res: Response): Promise<void> {
        try {
            // Check if image data is provided in the request body
            if (!req.body || !req.body.image) {
                res.status(400).json({ error: 'No image data provided' });
                return;
            }

            const { image } = req.body;

            // Convert base64 to buffer
            const imageBuffer = Buffer.from(image.split(',')[1], 'base64');

            // Create AWS Rekognition client
            const creds = await AwsClientFactory.getClient();
             
            VideoAPI.rekognitionClient = new RekognitionClient({
                region: process.env.AWS_REGION,
                credentials: {
                    accessKeyId: creds.AccessKeyId,
                    secretAccessKey: creds.SecretAccessKey,
                    sessionToken: creds.SessionToken,
                }
            });     
            
            // Create the command with the image data
            const command = new DetectFacesCommand({
                Image: {
                    Bytes: imageBuffer
                },
                Attributes: ['ALL']
            });
            
            // Send the command and get the response
            const response = await VideoAPI.rekognitionClient.send(command);

            // Return results to client
            res.json({
                success: true,
                faces: response.FaceDetails || []
            });
        } catch (error) {
            console.error('Error processing image for faces:', error);
            res.status(500).json({
                error: 'Error processing image',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Detect emotion from image using AWS Rekognition
    static async detectEmotionFromImage(imageBuffer: Buffer): Promise<string> {

        const command = new DetectFacesCommand({
            Image: {
                Bytes: imageBuffer
            },
            Attributes: ['ALL']
        });

        const response = await VideoAPI.rekognitionClient.send(command);

        if (response.FaceDetails && response.FaceDetails.length > 0) {
            const faceDetails = response.FaceDetails[0];
            const emotions = faceDetails.Emotions || [];

            // Find the emotion with highest confidence
            let dominantEmotion = 'neutral';
            let highestConfidence = 0;

            for (const emotion of emotions) {
                if (emotion.Confidence && emotion.Confidence > highestConfidence && emotion.Type) {
                    highestConfidence = emotion.Confidence;
                    dominantEmotion = emotion.Type.toLowerCase();
                }
            }

            return dominantEmotion;
        }

        return 'unknown';
    }

}