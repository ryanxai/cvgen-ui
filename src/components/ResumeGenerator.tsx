'use client';

import React, { useState } from 'react';
import { api, ResumeGenerationResponse } from '@/lib/api';

interface ResumeGeneratorProps {
  onGenerationSuccess: (result: ResumeGenerationResponse) => void;
  onGenerationError: (error: string) => void;
}

export default function ResumeGenerator({ onGenerationSuccess, onGenerationError }: ResumeGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateFromExisting = async () => {
    setIsGenerating(true);
    try {
      const result = await api.generateFromExistingJson();
      onGenerationSuccess(result);
    } catch (error) {
      onGenerationError(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Generate from Default Template
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Use the existing resume.json file on the server to generate a PDF resume.
        </p>
        
        <button
          onClick={handleGenerateFromExisting}
          disabled={isGenerating}
          className={`
            w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium
            transition-all duration-200 ease-in-out
            ${isGenerating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }
            text-white
          `}
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Generating Resume...
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
              Generate Resume PDF
            </>
          )}
        </button>
        
        <div className="mt-4 text-xs text-gray-500">
          This will use the default resume template stored on the server.
        </div>
      </div>
    </div>
  );
} 