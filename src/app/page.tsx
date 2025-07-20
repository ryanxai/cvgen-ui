'use client';

import React, { useState } from 'react';
import ResumeGenerator from '@/components/ResumeGenerator';
import ResumeForm from '@/components/ResumeForm';
import PdfDownload from '@/components/PdfDownload';
import { ResumeGenerationResponse } from '@/lib/api';
import { api } from '@/lib/api';

export default function HomePage() {
  const [generationResult, setGenerationResult] = useState<ResumeGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
    setFormData(null);
  };



  const handleFormGenerateResume = () => {
    // This will be called by the form when it's ready to generate
    // The form data is already stored in formData state
  };

  const handleFormDownloadJson = () => {
    if (!formData) {
      setError('Please fill out the form first');
      return;
    }
    
    try {
      // Convert form data to proper JSON structure
      const jsonData = {
        name: formData.personal.name,
        contact: {
          phone: formData.personal.phone,
          email: formData.personal.email,
          location: formData.personal.location,
          links: [
            { name: 'GitHub', url: formData.personal.links.github },
            { name: 'StackOverflow', url: formData.personal.links.stackoverflow },
            { name: 'GoogleScholar', url: formData.personal.links.googlescholar },
            { name: 'LinkedIn', url: formData.personal.links.linkedin }
          ].filter((link: any) => link.url.trim() !== '')
        },
        summary: formData.personal.summary,
        skills: formData.skills
          .filter((skillGroup: any) => skillGroup.items.length > 0)
          .map((skillGroup: any) => ({
            category: skillGroup.category,
            items: skillGroup.items
          })),
        experience: formData.experience
          .filter((exp: any) => exp.company && exp.position)
          .map((exp: any) => ({
            title: exp.position,
            company: exp.company,
            company_url: exp.company_url || '',
            company_description: exp.company_description || '',
            location: formData.personal.location,
            date_start: exp.start_date ? new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
            date_end: exp.end_date === 'Present' ? 'Present' : (exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''),
            achievements: exp.description
              .filter((desc: any) => desc.trim() !== '')
              .map((desc: any) => ({
                name: desc.split(':')[0] || 'Achievement',
                description: desc.split(':')[1] || desc
              }))
          })),
        education: formData.education
          .filter((edu: any) => edu.institution && edu.degree)
          .map((edu: any) => ({
            degree: `${edu.degree} in ${edu.field}`,
            institution: edu.institution,
            location: formData.personal.location,
            date_start: edu.start_date ? new Date(edu.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
            date_end: edu.end_date ? new Date(edu.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
          })),
        awards: formData.awards.map((award: any) => ({
          title: award.title,
          organization: award.organization,
          organization_detail: award.organization_detail,
          organization_url: award.organization_url,
          location: award.location,
          date: award.date ? new Date(award.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
        })),
        certifications: formData.certifications.map((cert: any) => ({
          title: cert.title,
          organization: cert.organization,
          url: cert.url,
          date: cert.date ? new Date(cert.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
        })),
        publications: formData.publications.map((pub: any) => ({
          authors: pub.authors,
          title: pub.title,
          venue: pub.venue,
          year: parseInt(pub.date) || new Date().getFullYear(),
          url: pub.url
        }))
      };
      
      // Convert to JSON string
      const jsonContent = JSON.stringify(jsonData, null, 2);
      
      // Create a blob and download link
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'resume-data.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      URL.revokeObjectURL(url);
    } catch (error) {
      handleError('Failed to download JSON file');
    }
  };

  const handleFormDownloadPdf = async () => {
    if (!formData) {
      setError('Please fill out the form first');
      return;
    }
    setIsFormLoading(true);
    try {
      // Implementation for downloading PDF from form data
    } catch (error) {
      handleError(error instanceof Error ? error.message : 'Failed to download PDF');
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleGenerateResume = async () => {
    if (!formData) {
      setError('Please fill out the form or upload JSON first');
      return;
    }

    setIsGenerating(true);
    try {
      // Convert form data to proper JSON structure
      const jsonData = {
        name: formData.personal.name,
        contact: {
          phone: formData.personal.phone,
          email: formData.personal.email,
          location: formData.personal.location,
          links: [
            { name: 'GitHub', url: formData.personal.links.github },
            { name: 'StackOverflow', url: formData.personal.links.stackoverflow },
            { name: 'GoogleScholar', url: formData.personal.links.googlescholar },
            { name: 'LinkedIn', url: formData.personal.links.linkedin }
          ].filter(link => link.url.trim() !== '')
        },
        summary: formData.personal.summary,
        skills: formData.skills
          .filter((skillGroup: any) => skillGroup.items.length > 0)
          .map((skillGroup: any) => ({
            category: skillGroup.category,
            items: skillGroup.items
          })),
        experience: formData.experience
          .filter((exp: any) => exp.company && exp.position)
          .map((exp: any) => ({
            title: exp.position,
            company: exp.company,
            company_url: exp.company_url || '',
            company_description: exp.company_description || '',
            location: formData.personal.location,
            date_start: exp.start_date ? new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
            date_end: exp.end_date === 'Present' ? 'Present' : (exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''),
            achievements: exp.description
              .filter((desc: any) => desc.trim() !== '')
              .map((desc: any) => ({
                name: desc.split(':')[0] || 'Achievement',
                description: desc.split(':')[1] || desc
              }))
          })),
        education: formData.education
          .filter((edu: any) => edu.institution && edu.degree)
          .map((edu: any) => ({
            degree: `${edu.degree} in ${edu.field}`,
            institution: edu.institution,
            location: formData.personal.location,
            date_start: edu.start_date ? new Date(edu.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
            date_end: edu.end_date ? new Date(edu.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
          })),
        awards: formData.awards.map((award: any) => ({
          title: award.title,
          organization: award.organization,
          organization_detail: award.organization_detail,
          organization_url: award.organization_url,
          location: award.location,
          date: award.date ? new Date(award.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
        })),
        certifications: formData.certifications.map((cert: any) => ({
          title: cert.title,
          organization: cert.organization,
          url: cert.url,
          date: cert.date ? new Date(cert.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
        })),
        publications: formData.publications.map((pub: any) => ({
          authors: pub.authors,
          title: pub.title,
          venue: pub.venue,
          year: parseInt(pub.date) || new Date().getFullYear(),
          url: pub.url
        }))
      };

      // Log the request body that will be sent to /generate-resume
      console.log('Request body sent to /generate-resume:');
      console.log(JSON.stringify(jsonData, null, 2));
      
      // Create a downloadable file with the request body
      try {
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'request_body.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('Request body saved as request_body.json (downloaded)');
      } catch (fileError) {
        console.error('Failed to save request body to file:', fileError);
      }
      
      const result = await api.generateFromData(jsonData);
      handleSuccess(result);
    } catch (error) {
      handleError(error instanceof Error ? error.message : 'Failed to generate resume');
    } finally {
      setIsGenerating(false);
    }
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
                <p className="text-sm text-gray-500">Create professional PDFs from JSON</p>
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

        {/* Main Action Buttons */}
        {!generationResult && (
          <div className="text-center mb-8">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-4">
                {/* Upload JSON */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex flex-col items-center space-y-3">
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
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                      />
                    </svg>
                    <h4 className="font-medium text-gray-900">Upload JSON</h4>
                    <p className="text-sm text-gray-600 text-center">
                      Upload your resume data file in the form below
                    </p>
                    <button
                      type="button"
                      onClick={() => document.getElementById('resume-form')?.scrollIntoView({ behavior: 'smooth' })}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Go to Form
                    </button>
                  </div>
                </div>

                {/* Generate Resume */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex flex-col items-center space-y-3">
                    <svg
                      className="w-8 h-8 text-green-600"
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
                    <h4 className="font-medium text-gray-900">Generate Resume</h4>
                    <p className="text-sm text-gray-600 text-center">
                      {formData ? 'Create PDF from your data' : 'Fill form or upload JSON first'}
                    </p>
                    <button
                      onClick={handleGenerateResume}
                      disabled={!formData || isGenerating}
                      className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        formData
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isGenerating ? 'Generating...' : 'Generate PDF'}
                    </button>
                  </div>
                </div>

                {/* Download JSON */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex flex-col items-center space-y-3">
                    <svg
                      className="w-8 h-8 text-orange-600"
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
                    <h4 className="font-medium text-gray-900">Download JSON</h4>
                    <p className="text-sm text-gray-600 text-center">
                      {formData ? 'Download your resume data' : 'Fill form first'}
                    </p>
                    <button
                      onClick={handleFormDownloadJson}
                      disabled={!formData}
                      className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        formData
                          ? 'bg-orange-600 text-white hover:bg-orange-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Download JSON
                    </button>
                  </div>
                </div>


              </div>
            </div>
          </div>
        )}

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
              <div id="resume-form">
                <ResumeForm
                  onFormSuccess={handleSuccess}
                  onFormError={handleError}
                  onFormDataReady={(data) => {
                    setFormData(data);
                  }}
                  onGenerateResume={handleFormGenerateResume}
                  onDownloadJson={handleFormDownloadJson}
                  onDownloadPdf={handleFormDownloadPdf}
                  isLoading={isFormLoading}
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
              <span className="font-medium text-gray-700">JSON to PDF Resume Builder API</span>
              {' • '}
              Built with Next.js and deployed on Vercel
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
