'use client';

import React, { useState } from 'react';
import { api, ResumeGenerationResponse } from '@/lib/api';

interface PdfDownloadProps {
  generationResult: ResumeGenerationResponse | null;
}

export default function PdfDownload({ generationResult }: PdfDownloadProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!generationResult) return;

    setIsDownloading(true);
    try {
      const blob = await api.downloadPdf(generationResult.filename);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = generationResult.filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = () => {
    if (!generationResult) return;
    
    const downloadUrl = api.getDownloadUrl(generationResult.filename);
    window.open(downloadUrl, '_blank');
  };

  if (!generationResult) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-green-900">
              Resume Generated Successfully!
            </h3>
            <p className="text-sm text-green-700 mt-1">
              {generationResult.message}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={`
              w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium
              transition-all duration-200 ease-in-out
              ${isDownloading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
              }
              text-white
            `}
          >
            {isDownloading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Downloading...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download PDF ({generationResult.filename})
              </>
            )}
          </button>

          <button
            onClick={handlePreview}
            className="w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium border border-green-300 text-green-700 bg-white hover:bg-green-50 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 ease-in-out"
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Preview in Browser
          </button>
        </div>

        <div className="mt-4 text-xs text-green-600">
          File ready: {generationResult.filename}
        </div>
      </div>
    </div>
  );
} 