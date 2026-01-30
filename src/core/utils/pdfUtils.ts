/**
 * PDF Utilities for Statement Scanner
 * Converts PDF files to images for AI processing
 */

import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set worker source for pdf.js (using Vite's ?url import)
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

/**
 * Convert a PDF file to an array of base64 image strings
 * Each page of the PDF becomes one image
 */
export async function pdfToImages(file: File, scale: number = 2.0): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const images: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    // Create canvas for rendering
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not get canvas context');
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Render PDF page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    // Convert canvas to base64 image
    const imageData = canvas.toDataURL('image/png');
    images.push(imageData);
  }

  return images;
}

/**
 * Get just the base64 data without the data URL prefix
 * Useful for APIs that expect raw base64
 */
export function getBase64Data(dataUrl: string): string {
  return dataUrl.replace(/^data:image\/\w+;base64,/, '');
}

/**
 * Get the MIME type from a data URL
 */
export function getMimeType(dataUrl: string): string {
  const match = dataUrl.match(/^data:(image\/\w+);base64,/);
  return match ? match[1] : 'image/png';
}
