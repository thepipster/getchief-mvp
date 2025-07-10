import pdf from 'pdf-parse';
import fs from 'fs/promises';
import { Logger } from './Logger';

export class PdfReader {

    text: string = '';

    constructor() {
    }

    async fromFile(filePath: string){
        const base64PDF = await fs.readFile(filePath, { encoding: 'base64' });
        this.text = await this.cleanText(base64PDF);
    }

    async fromString(data: string){
        this.text = await this.cleanText(data);
    }    

    getText(): string {
        return this.text;
    }

    private async cleanText(base64Data: string): Promise<string> {
        try {
            // Remove data URL prefix if present
            base64Data = base64Data.replace(/^data:application\/pdf;base64,/, '');

            // Convert base64 to buffer
            const pdfBuffer = Buffer.from(base64Data, 'base64');

            // Parse PDF and extract text
            const pdfData = await pdf(pdfBuffer);

            if (!pdfData.text || pdfData.text.trim().length === 0) {
                throw new Error('No text content found in PDF');
            }

            return pdfData.text;

        } catch (error) {
            Logger.error('Error extracting text from PDF:', error);
            throw new Error(`Failed to extract text from PDF`);
        }        
    }


}
