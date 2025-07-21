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
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
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
                <p className="text-sm text-gray-500">Create Professional PDF Resumes</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}

        {/* Main Action Buttons */}
        {!isGenerating && (
          <div className="text-center mb-8">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-4">
                {/* Upload JSON Resume Data */}
                <div id="upload-json-section" className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex flex-col items-center space-y-3">
                    <div
                      className={`
                        relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer w-full
                        transition-all duration-200 ease-in-out
                        ${isUploadingJson 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-gray-400'
                        }
                      `}
                      onClick={openFileDialog}
                      onDrop={(e) => {
                        e.preventDefault();
                        const files = Array.from(e.dataTransfer.files);
                        if (files.length > 0) {
                          handleJsonFileUpload(files[0]);
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                      }}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={isUploadingJson}
                      />
                      
                      <div className="flex flex-col items-center space-y-2">
                        {isUploadingJson ? (
                          <>
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                            <p className="text-gray-600 text-sm">Reading JSON file...</p>
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-6 h-6 text-blue-500"
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
                            <div>
                              <p className="text-xs font-medium text-gray-900">
                                Drop your JSON file here
                              </p>
                              <p className="text-xs text-gray-500">
                                or click to browse files
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
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
                      className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isUploadingJson
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isUploadingJson ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Loading...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>Use Default Json</span>
                        </div>
                      )}
                    </button>
                    
                    {jsonUploadSuccess && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2 w-full">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-xs text-green-800">JSON file loaded successfully!</span>
                        </div>
                      </div>
                    )}
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
                      Generate PDF
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
