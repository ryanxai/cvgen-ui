'use client';

import React, { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import ResumeGenerator from '@/components/ResumeGenerator';
import ResumeForm from '@/components/ResumeForm';
import PdfDownload from '@/components/PdfDownload';
import { ResumeGenerationResponse } from '@/lib/api';

export default function HomePage() {
  const [generationResult, setGenerationResult] = useState<ResumeGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = (result: ResumeGenerationResponse) => {
    setGenerationResult(result);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setGenerationResult(null);
  };

  const handleReset = () => {
    setGenerationResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Resume Builder</h1>
                <p className="text-sm text-gray-500">Create professional PDFs from YAML</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>API Ready</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Transform Your Resume
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Fill out our form, upload your YAML file, or use our default template to generate 
            a professional PDF resume in seconds.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 max-w-md mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={handleReset}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success/Download Section */}
        {generationResult && (
          <div className="mb-8">
            <PdfDownload generationResult={generationResult} />
            <div className="text-center mt-6">
              <button
                onClick={handleReset}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Generate Another Resume
              </button>
            </div>
          </div>
        )}

        {/* Main Actions - Only show if no result */}
        {!generationResult && (
          <div className="space-y-8 mb-12">
            {/* Form Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 text-center">
                Create Resume with Form
              </h3>
              <p className="text-gray-600 text-center text-sm mb-6">
                Fill out our comprehensive form to create your resume data and generate a professional PDF.
              </p>
              <ResumeForm
                onFormSuccess={handleSuccess}
                onFormError={handleError}
              />
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center py-4">
              <div className="bg-gray-200 h-px flex-1"></div>
              <div className="px-4 text-gray-500 text-sm font-medium">
                OR
              </div>
              <div className="bg-gray-200 h-px flex-1"></div>
            </div>

            {/* Alternative Options */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Upload Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 text-center">
                  Upload Custom YAML
                </h3>
                <p className="text-gray-600 text-center text-sm mb-6">
                  Have your own resume.yaml file? Upload it here to generate a custom PDF.
                </p>
                <FileUpload 
                  onUploadSuccess={handleSuccess}
                  onUploadError={handleError}
                />
              </div>

              {/* Generate Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 text-center">
                  Use Default Template
                </h3>
                <p className="text-gray-600 text-center text-sm mb-6">
                  Generate a resume using our pre-configured template and sample data.
                </p>
                <ResumeGenerator
                  onGenerationSuccess={handleSuccess}
                  onGenerationError={handleError}
                />
              </div>
            </div>
          </div>
        )}

        {/* Features Section */}
        {!generationResult && (
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h4>
              <p className="text-gray-600 text-sm">
                Generate professional PDFs in seconds using our optimized LaTeX processing.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Secure & Private</h4>
              <p className="text-gray-600 text-sm">
                Your data is processed securely and temporarily. No permanent storage of personal information.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Professional Quality</h4>
              <p className="text-gray-600 text-sm">
                LaTeX-powered typesetting ensures your resume looks crisp and professional.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>
              Powered by{' '}
              <span className="font-medium text-gray-700">YAML to PDF Resume Builder API</span>
              {' • '}
              Built with Next.js and deployed on Vercel
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
