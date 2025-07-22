'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';

interface AiAchievementImproverProps {
  currentDescription: string;
  onDescriptionChange: (newDescription: string) => void;
}

export default function AiAchievementImprover({ currentDescription, onDescriptionChange }: AiAchievementImproverProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [improvedDescription, setImprovedDescription] = useState('');
  const [error, setError] = useState('');

  const handleImproveDescription = async () => {
    if (!currentDescription.trim()) {
      setError('Please enter a description to improve');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.improveResumeSection(currentDescription, 'Achievement');
      setImprovedDescription(response.improved_section);
      setShowComparison(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to improve description');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    const maxLength = 1024;
    if (improvedDescription.length <= maxLength) {
      onDescriptionChange(improvedDescription);
      setShowComparison(false);
      setImprovedDescription('');
    }
  };

  const handleDecline = () => {
    setShowComparison(false);
    setImprovedDescription('');
  };

  const handleRetry = () => {
    setShowComparison(false);
    setImprovedDescription('');
    handleImproveDescription();
  };

  return (
    <div className="space-y-4">
      {/* AI Improve Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleImproveDescription}
          disabled={isLoading || !currentDescription.trim()}
          className="inline-flex items-center gap-2 px-4 sm:px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-md hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm whitespace-nowrap"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Improving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Improve
            </>
          )}
        </button>
        <span className="text-xs text-gray-500">Get AI-powered professional improvements</span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}

      {/* Comparison View */}
      {showComparison && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Description Comparison</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Original Description */}
            <div>
              <h5 className="text-xs font-medium text-red-700 mb-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Original
              </h5>
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3 min-h-[80px]">
                {currentDescription || 'No description provided'}
              </div>
            </div>

            {/* Improved Description */}
            <div>
              <h5 className="text-xs font-medium text-green-700 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Improved
                </span>
                <span className={`text-xs ${improvedDescription.length > 1024 ? 'text-red-500' : 'text-gray-500'}`}>
                  {improvedDescription.length}/1024
                </span>
              </h5>
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3 min-h-[80px]">
                {improvedDescription}
              </div>
              {improvedDescription.length > 1024 && (
                <div className="mt-1 text-red-500 text-xs">
                  Improved description exceeds character limit
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleApply}
              disabled={improvedDescription.length > 1024}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Apply Improved
            </button>
            
            <button
              type="button"
              onClick={handleDecline}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Keep Original
            </button>

            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 