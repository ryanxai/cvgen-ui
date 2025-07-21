'use client';

import React, { useState, useRef, useCallback } from 'react';
import ResumeForm from '@/components/ResumeForm';
import { ResumeGenerationResponse } from '@/lib/api';
import { api } from '@/lib/api';

// Define proper types for form data
interface FormData {
  personal: {
    name: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
    links: {
      github: string;
      stackoverflow: string;
      googlescholar: string;
      linkedin: string;
    };
  };
  experience: Array<{
    company: string;
    position: string;
    company_url: string;
    company_description: string;
    start_date: string;
    end_date: string;
    description: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    start_date: string;
    end_date: string;
  }>;
  skills: Array<{
    category: string;
    items: string[];
  }>;
  awards: Array<{
    title: string;
    organization: string;
    organization_detail: string;
    organization_url: string;
    location: string;
    date: string;
  }>;
  certifications: Array<{
    title: string;
    organization: string;
    url: string;
    date: string;
  }>;
  publications: Array<{
    authors: string;
    title: string;
    venue: string;
    date: string;
    url: string;
  }>;
}

interface Link {
  name: string;
  url: string;
}

interface Achievement {
  name: string;
  description: string;
}

interface Experience {
  title: string;
  company: string;
  company_url: string;
  company_description: string;
  location: string;
  date_start: string;
  date_end: string;
  achievements: Achievement[];
}

interface Education {
  degree: string;
  institution: string;
  location: string;
  date_start: string;
  date_end: string;
}

interface Award {
  title: string;
  organization: string;
  organization_detail: string;
  organization_url: string;
  location: string;
  date: string;
}

interface Certification {
  title: string;
  organization: string;
  url: string;
  date: string;
}

interface Publication {
  authors: string;
  title: string;
  venue: string;
  year: number;
  url: string;
  date?: string;
}

interface JsonData {
  name: string;
  contact: {
    phone: string;
    email: string;
    location: string;
    links: Link[];
  };
  summary: string;
  skills: Array<{
    category: string;
    items: string[];
  }>;
  experience: Experience[];
  education: Education[];
  awards: Award[];
  certifications: Certification[];
  publications: Publication[];
}

export default function HomePage() {
  const [isFormLoading] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingJson, setIsUploadingJson] = useState(false);
  const [jsonUploadSuccess, setJsonUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSuccess = async (result: ResumeGenerationResponse) => {
    // Automatically trigger PDF download
    try {
      const blob = await api.downloadPdf(result.filename);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };





  const handleFormDataChange = useCallback((data: FormData) => {
    setFormData(data);
  }, []);

  const convertDateToAbbreviated = (dateString: string): string => {
    if (!dateString || dateString === 'Present') return dateString;
    
    // Handle ISO format "yyyy-mm-dd" directly to avoid timezone issues
    const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1]);
      const month = parseInt(isoMatch[2]) - 1; // Convert to 0-based index
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[month]} ${year}`;
    }
    
    // Handle abbreviated format "Mar 2021"
    const match = dateString.match(/^([A-Za-z]{3})\s+(\d{4})$/);
    if (match) {
      return dateString; // Already in correct format
    }
    
    // Handle year-only format "2023"
    const yearMatch = dateString.match(/^(\d{4})$/);
    if (yearMatch) {
      return `Jan ${yearMatch[1]}`;
    }
    
    // Fallback to Date constructor for other formats
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${month} ${year}`;
    }
    
    return dateString;
  };

  const handleFormGenerateResume = () => {
    // This will be called by the form when it's ready to generate
    // The form data is already stored in formData state
  };

  const handleFormDownloadJson = () => {
    if (!formData) {
      return;
    }
    
    try {
      // Convert form data to proper JSON structure
      const jsonData: JsonData = {
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
          ].filter((link: Link) => link.url.trim() !== '')
        },
        summary: formData.personal.summary,
        skills: formData.skills
          .filter((skillGroup) => skillGroup.items.length > 0)
          .map((skillGroup) => ({
            category: skillGroup.category,
            items: skillGroup.items
          })),
        experience: formData.experience
          .filter((exp) => exp.company && exp.position)
          .map((exp) => ({
            title: exp.position,
            company: exp.company,
            company_url: exp.company_url || '',
            company_description: exp.company_description || '',
            location: formData.personal.location,
            date_start: convertDateToAbbreviated(exp.start_date),
            date_end: exp.end_date === 'Present' ? 'Present' : convertDateToAbbreviated(exp.end_date),
            achievements: exp.description
              .filter((desc: string) => desc.trim() !== '')
              .map((desc: string) => ({
                name: desc.split(':')[0] || 'Achievement',
                description: desc.split(':')[1] || desc
              }))
          })),
        education: formData.education
          .filter((edu) => edu.institution && edu.degree)
          .map((edu) => ({
            degree: `${edu.degree} in ${edu.field}`,
            institution: edu.institution,
            location: formData.personal.location,
            date_start: convertDateToAbbreviated(edu.start_date),
            date_end: convertDateToAbbreviated(edu.end_date)
          })),
        awards: formData.awards.map((award) => ({
          title: award.title,
          organization: award.organization,
          organization_detail: award.organization_detail,
          organization_url: award.organization_url,
          location: award.location,
          date: convertDateToAbbreviated(award.date)
        })),
        certifications: formData.certifications.map((cert) => ({
          title: cert.title,
          organization: cert.organization,
          url: cert.url,
          date: convertDateToAbbreviated(cert.date)
        })),
        publications: formData.publications.map((pub) => ({
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
    } catch (err) {
      console.error('Failed to download JSON file:', err);
    }
  };



  const handleGenerateResume = async () => {
    if (!formData) {
      return;
    }

    setIsGenerating(true);
    try {
      // Convert form data to proper JSON structure
      const jsonData: JsonData = {
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
          .filter((skillGroup) => skillGroup.items.length > 0)
          .map((skillGroup) => ({
            category: skillGroup.category,
            items: skillGroup.items
          })),
        experience: formData.experience
          .filter((exp) => exp.company && exp.position)
          .map((exp) => ({
            title: exp.position,
            company: exp.company,
            company_url: exp.company_url || '',
            company_description: exp.company_description || '',
            location: formData.personal.location,
            date_start: convertDateToAbbreviated(exp.start_date),
            date_end: exp.end_date === 'Present' ? 'Present' : convertDateToAbbreviated(exp.end_date),
            achievements: exp.description
              .filter((desc: string) => desc.trim() !== '')
              .map((desc: string) => ({
                name: desc.split(':')[0] || 'Achievement',
                description: desc.split(':')[1] || desc
              }))
          })),
        education: formData.education
          .filter((edu) => edu.institution && edu.degree)
          .map((edu) => ({
            degree: `${edu.degree} in ${edu.field}`,
            institution: edu.institution,
            location: formData.personal.location,
            date_start: convertDateToAbbreviated(edu.start_date),
            date_end: convertDateToAbbreviated(edu.end_date)
          })),
        awards: formData.awards.map((award) => ({
          title: award.title,
          organization: award.organization,
          organization_detail: award.organization_detail,
          organization_url: award.organization_url,
          location: award.location,
          date: convertDateToAbbreviated(award.date)
        })),
        certifications: formData.certifications.map((cert) => ({
          title: cert.title,
          organization: cert.organization,
          url: cert.url,
          date: convertDateToAbbreviated(cert.date)
        })),
        publications: formData.publications.map((pub) => ({
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
      
      const result = await api.generateFromData(jsonData as unknown as Record<string, unknown>);
      handleSuccess(result);
    } catch (err) {
      console.error('Failed to generate resume:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // JSON file upload functions
  const validateJsonFile = (file: File): string | null => {
    if (file.size > 5 * 1024 * 1024) {
      return 'File size must be less than 5MB';
    }
    if (!file.name.toLowerCase().endsWith('.json')) {
      return 'File must be a JSON file';
    }
    return null;
  };

  const convertAbbreviatedDateToFormDate = (dateString: string): string => {
    if (!dateString || dateString === 'Present') return dateString;
    
    // Handle "Mar 2021" format
    const match = dateString.match(/^([A-Za-z]{3})\s+(\d{4})$/);
    if (match) {
      const monthStr = match[1];
      const year = match[2];
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = months.findIndex(m => m.toLowerCase() === monthStr.toLowerCase());
      
      if (monthIndex !== -1) {
        const month = (monthIndex + 1).toString().padStart(2, '0');
        return `${year}-${month}-01`;
      }
    }
    
    // Handle year-only format like "2023"
    const yearMatch = dateString.match(/^(\d{4})$/);
    if (yearMatch) {
      const year = yearMatch[1];
      return `${year}-01-01`; // Default to January 1st of that year
    }
    
    // Handle "yyyy-mm-dd" format directly
    const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      return dateString; // Already in correct format
    }
    
    // Try to parse as regular date
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return dateString;
  };

  const parseJsonToFormData = (jsonContent: string): FormData => {
    const data = JSON.parse(jsonContent);
    
    // Convert the JSON structure to form data format
    return {
      personal: {
        name: data.name || '',
        email: data.contact?.email || '',
        phone: data.contact?.phone || '',
        location: data.contact?.location || '',
        summary: data.summary || '',
        links: {
          github: data.contact?.links?.find((link: Link) => link.name === 'GitHub')?.url || '',
          stackoverflow: data.contact?.links?.find((link: Link) => link.name === 'StackOverflow')?.url || '',
          googlescholar: data.contact?.links?.find((link: Link) => link.name === 'GoogleScholar')?.url || '',
          linkedin: data.contact?.links?.find((link: Link) => link.name === 'LinkedIn')?.url || '',
        },
      },
      experience: data.experience?.map((exp: Experience) => ({
        company: exp.company || '',
        position: exp.title || '',
        company_url: exp.company_url || '',
        company_description: exp.company_description || '',
        start_date: convertAbbreviatedDateToFormDate(exp.date_start || ''),
        end_date: exp.date_end === 'Present' ? 'Present' : convertAbbreviatedDateToFormDate(exp.date_end || ''),
        description: exp.achievements?.map((achievement: Achievement) => 
          `${achievement.name}: ${achievement.description}`
        ) || [''],
      })) || [],
      education: data.education?.map((edu: Education) => ({
        institution: edu.institution || '',
        degree: edu.degree?.split(' in ')[0] || '',
        field: edu.degree?.split(' in ')[1] || '',
        start_date: convertAbbreviatedDateToFormDate(edu.date_start || ''),
        end_date: convertAbbreviatedDateToFormDate(edu.date_end || ''),
      })) || [],
      skills: data.skills?.map((skillGroup: { category: string; items: string[] | string }) => ({
        category: skillGroup.category || 'Technical Skills',
        items: Array.isArray(skillGroup.items) ? skillGroup.items : 
               typeof skillGroup.items === 'string' ? skillGroup.items.split(',').map((s: string) => s.trim()).filter((s: string) => s) : [],
      })) || [],
      awards: data.awards?.map((award: Award) => ({
        title: award.title || '',
        organization: award.organization || '',
        organization_detail: award.organization_detail || '',
        organization_url: award.organization_url || '',
        location: award.location || '',
        date: convertAbbreviatedDateToFormDate(award.date || ''),
      })) || [],
      certifications: data.certifications?.map((cert: Certification) => ({
        title: cert.title || '',
        organization: cert.organization || '',
        url: cert.url || '',
        date: convertAbbreviatedDateToFormDate(cert.date || ''),
      })) || [],
      publications: data.publications?.map((pub: Publication) => ({
        authors: pub.authors || '',
        title: pub.title || '',
        venue: pub.venue || '',
        date: pub.year?.toString() || convertAbbreviatedDateToFormDate(pub.date || ''),
        url: pub.url || '',
      })) || [],
    };
  };

  const handleJsonFileUpload = async (file: File) => {
    const validationError = validateJsonFile(file);
    if (validationError) {
      return;
    }

    setIsUploadingJson(true);
    try {
      const text = await file.text();
      const parsedData = parseJsonToFormData(text);
      setFormData(parsedData);
      setJsonUploadSuccess(true);
      // Clear success message after 3 seconds
      setTimeout(() => setJsonUploadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to parse JSON file:', err);
    } finally {
      setIsUploadingJson(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleJsonFileUpload(files[0]);
    }
    // Reset the file input value so the same file can be selected again
    e.target.value = '';
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
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
                <p className="text-sm text-gray-500">Create Professional PDF Resumes</p>
              </div>
            </div>
            
            {/* Header Action Buttons */}
            <div className="flex items-center space-x-4">
              {jsonUploadSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-green-800">JSON loaded successfully!</span>
                  </div>
                </div>
              )}
              {/* Upload JSON */}
              <div className="relative">
                <button
                  onClick={openFileDialog}
                  disabled={isUploadingJson}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isUploadingJson
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  <span>Upload JSON</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploadingJson}
                />
              </div>

              {/* Use Default JSON */}
              <button
                onClick={async () => {
                  try {
                    setIsUploadingJson(true);
                    const response = await fetch('/resume.json');
                    const jsonContent = await response.text();
                    const parsedData = parseJsonToFormData(jsonContent);
                    setFormData(parsedData);
                    setJsonUploadSuccess(true);
                    setTimeout(() => setJsonUploadSuccess(false), 3000);
                  } catch {
                    console.error('Failed to load default JSON file');
                  } finally {
                    setIsUploadingJson(false);
                  }
                }}
                disabled={isUploadingJson}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isUploadingJson
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Use Default JSON</span>
              </button>

              {/* Download Resume */}
              <button
                onClick={handleGenerateResume}
                disabled={!formData || isGenerating}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  formData && !isGenerating
                    ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download Resume</span>
              </button>

              {/* Download JSON */}
              <button
                onClick={handleFormDownloadJson}
                disabled={!formData}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  formData
                    ? 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download JSON</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        {/* Hero Section */}



        {/* Loading Section */}
        {isGenerating && (
          <div className="text-center mb-8">
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="flex flex-col items-center space-y-4">
                  {/* Sand Clock Icon */}
                  <div className="relative">
                    <svg
                      className="w-16 h-16 text-blue-600 animate-pulse"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Generating Your PDF
                    </h3>
                    <p className="text-sm text-gray-600">
                      Please wait while we create your professional resume...
                    </p>
                  </div>
                  {/* Spinning dots */}
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {/* Error handling is now managed by ResumeForm */}



        {/* Main Actions */}
        <div className="space-y-8 mb-12">

            {/* Form Section */}
            <div className="space-y-4">
                                        <div id="resume-form" className="relative">
                <ResumeForm
                  onFormSuccess={handleSuccess}
                  onFormError={(errorMessage: string) => console.error('Form error:', errorMessage)}
                  onGenerateResume={handleFormGenerateResume}
                  isLoading={isFormLoading}
                  externalFormData={formData}
                  onFormDataChange={handleFormDataChange}
                />
              
              {/* Loading overlay */}
              {isGenerating && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Generating PDF...</p>
                  </div>
                </div>
              )}
            </div>
            </div>
        </div>

        {/* Features Section */}
        {!isGenerating && (
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
