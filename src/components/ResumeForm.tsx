'use client';

import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';

interface ResumeFormData {
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
    items: string;
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

interface ResumeFormProps {
  onFormSuccess: (result: { message: string; filename: string; download_url: string }) => void;
  onFormError: (error: string) => void;
  onFormDataReady?: (formData: ResumeFormData) => void;
  onGenerateResume?: () => void;
  onDownloadJson?: () => void;
  onDownloadPdf?: () => void;
  isLoading?: boolean;
}

export default function ResumeForm({ 
  onFormSuccess, 
  onFormError, 
  onFormDataReady,
  onGenerateResume, 
  onDownloadJson, 
  onDownloadPdf, 
  isLoading: externalIsLoading 
}: ResumeFormProps) {
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const isLoading = externalIsLoading !== undefined ? externalIsLoading : internalIsLoading;
  const [isUploadingJson, setIsUploadingJson] = useState(false);
  const [jsonUploadSuccess, setJsonUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<ResumeFormData>({
    personal: {
      name: '',
      email: '',
      phone: '',
      location: '',
      summary: '',
      links: {
        github: '',
        stackoverflow: '',
        googlescholar: '',
        linkedin: '',
      },
    },
    experience: [
      {
        company: '',
        position: '',
        company_url: '',
        company_description: '',
        start_date: '',
        end_date: '',
        description: [''],
      },
    ],
    education: [
      {
        institution: '',
        degree: '',
        field: '',
        start_date: '',
        end_date: '',
      },
    ],
    skills: [
      {
        category: 'Technical Skills',
        items: '',
      },
    ],
    awards: [],
    certifications: [],
    publications: [],
  });

  // Call onFormDataReady when formData changes
  useEffect(() => {
    if (onFormDataReady) {
      onFormDataReady(formData);
    }
  }, [formData, onFormDataReady]);

  const convertDateToAbbreviated = (dateString: string): string => {
    if (!dateString || dateString === 'Present') return dateString;
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${month} ${year}`;
  };

  const convertAbbreviatedDateToFormDate = (dateString: string): string => {
    if (!dateString || dateString === 'Present') return '';
    
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
    
    return '';
  };

  const parseJsonToFormData = (jsonContent: string): ResumeFormData => {
    try {
      // Parse JSON content
      const data = JSON.parse(jsonContent) as Record<string, unknown>;
      
      const formData: ResumeFormData = {
        personal: {
          name: (data.name as string) || '',
          email: ((data.contact as Record<string, unknown>)?.email as string) || '',
          phone: ((data.contact as Record<string, unknown>)?.phone as string) || '',
          location: ((data.contact as Record<string, unknown>)?.location as string) || '',
          summary: (data.summary as string) || '',
          links: {
            github: ((data.contact as Record<string, unknown>)?.links as Array<Record<string, string>>)?.find((link) => link.name === 'GitHub')?.url || '',
            stackoverflow: ((data.contact as Record<string, unknown>)?.links as Array<Record<string, string>>)?.find((link) => link.name === 'StackOverflow')?.url || '',
            googlescholar: ((data.contact as Record<string, unknown>)?.links as Array<Record<string, string>>)?.find((link) => link.name === 'GoogleScholar')?.url || '',
            linkedin: ((data.contact as Record<string, unknown>)?.links as Array<Record<string, string>>)?.find((link) => link.name === 'LinkedIn')?.url || '',
          },
        },
        experience: ((data.experience as Array<Record<string, unknown>>) || []).map((exp) => ({
          company: (exp.company as string) || '',
          position: (exp.title as string) || '',
          company_url: (exp.company_url as string) || '',
          company_description: (exp.company_description as string) || '',
          start_date: convertAbbreviatedDateToFormDate((exp.date_start as string) || ''),
          end_date: (exp.date_end as string) === 'Present' ? 'Present' : convertAbbreviatedDateToFormDate((exp.date_end as string) || ''),
          description: ((exp.achievements as Array<Record<string, string>>) || []).map((achievement) => achievement.description || ''),
        })),
        education: ((data.education as Array<Record<string, unknown>>) || []).map((edu) => ({
          institution: (edu.institution as string) || '',
          degree: (edu.degree as string) || '',
          field: '',
          start_date: convertAbbreviatedDateToFormDate((edu.date_start as string) || ''),
          end_date: convertAbbreviatedDateToFormDate((edu.date_end as string) || ''),
        })),
        skills: ((data.skills as Array<Record<string, unknown>>) || []).map((skillGroup) => ({
          category: (skillGroup.category as string) || '',
          items: typeof skillGroup.items === 'string' ? skillGroup.items : (skillGroup.items as string[])?.join(', ') || '',
        })),
        awards: ((data.awards as Array<Record<string, unknown>>) || []).map((award) => ({
          title: (award.title as string) || '',
          organization: (award.organization as string) || '',
          organization_detail: (award.organization_detail as string) || '',
          organization_url: (award.organization_url as string) || '',
          location: (award.location as string) || '',
          date: (award.date as string) || '',
        })),
        certifications: ((data.certifications as Array<Record<string, unknown>>) || []).map((cert) => ({
          title: (cert.title as string) || '',
          organization: (cert.organization as string) || '',
          url: (cert.url as string) || '',
          date: (cert.date as string) || '',
        })),
        publications: ((data.publications as Array<Record<string, unknown>>) || []).map((pub) => ({
          authors: (pub.authors as string) || '',
          title: (pub.title as string) || '',
          venue: (pub.venue as string) || '',
          date: ((pub.year as number)?.toString()) || '',
          url: (pub.url as string) || '',
        })),
      };

      return formData;
    } catch {
      throw new Error('Failed to parse JSON file. Please check the format.');
    }
  };

  const convertToJson = (data: ResumeFormData): string => {
    // Convert experience to the correct format
    const experience = data.experience
      .filter(exp => exp.company && exp.position)
      .map(exp => ({
        title: exp.position,
        company: exp.company,
        company_url: exp.company_url || '',
        company_description: exp.company_description || '',
        location: data.personal.location,
        date_start: convertDateToAbbreviated(exp.start_date),
        date_end: exp.end_date ? convertDateToAbbreviated(exp.end_date) : 'Present',
        achievements: exp.description
          .filter(desc => desc.trim() !== '')
          .map(desc => ({
            name: desc.split(':')[0] || 'Achievement',
            description: desc.split(':')[1] || desc
          }))
      }));

    // Convert education to the correct format
    const education = data.education
      .filter(edu => edu.institution && edu.degree)
      .map(edu => ({
        degree: `${edu.degree} in ${edu.field}`,
        institution: edu.institution,
        location: data.personal.location,
        date_start: convertDateToAbbreviated(edu.start_date),
        date_end: convertDateToAbbreviated(edu.end_date)
      }));

    // Convert skills to the correct format
    const skills = data.skills
      .filter(skillGroup => skillGroup.items.trim() !== '')
      .map(skillGroup => ({
        category: skillGroup.category,
        items: skillGroup.items.trim()
      }));

    // Build the JSON content
    const jsonData = {
      name: data.personal.name,
      contact: {
        phone: data.personal.phone,
        email: data.personal.email,
        location: data.personal.location,
        links: [
          { name: 'GitHub', url: data.personal.links.github },
          { name: 'StackOverflow', url: data.personal.links.stackoverflow },
          { name: 'GoogleScholar', url: data.personal.links.googlescholar },
          { name: 'LinkedIn', url: data.personal.links.linkedin }
        ].filter(link => link.url.trim() !== '')
      },
      summary: data.personal.summary,
      skills: skills,
      experience: experience,
      education: education,
      awards: data.awards.map(award => ({
        title: award.title,
        organization: award.organization,
        organization_detail: award.organization_detail,
        organization_url: award.organization_url,
        location: award.location,
        date: convertDateToAbbreviated(award.date)
      })),
      certifications: data.certifications.map(cert => ({
        title: cert.title,
        organization: cert.organization,
        url: cert.url,
        date: convertDateToAbbreviated(cert.date)
      })),
      publications: data.publications.map(pub => ({
        authors: pub.authors,
        title: pub.title,
        venue: pub.venue,
        year: parseInt(pub.date) || new Date().getFullYear(),
        url: pub.url
      }))
    };

    return JSON.stringify(jsonData, null, 2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onGenerateResume) {
      onGenerateResume();
      return;
    }
    
    setInternalIsLoading(true);

    try {
      const jsonContent = convertToJson(formData);
      const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
      const jsonFile = new File([jsonBlob], 'resume.json', { type: 'application/json' });

      const result = await api.uploadJsonAndGenerate(jsonFile);
      onFormSuccess(result);
    } catch (error) {
      onFormError(error instanceof Error ? error.message : 'Failed to generate resume');
    } finally {
      setInternalIsLoading(false);
    }
  };



  const updatePersonal = (field: keyof ResumeFormData['personal'], value: string | ResumeFormData['personal']['links']) => {
    setFormData(prev => ({
      ...prev,
      personal: { ...prev.personal, [field]: value }
    }));
  };

  const updateExperience = (index: number, field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        company: '',
        position: '',
        company_url: '',
        company_description: '',
        start_date: '',
        end_date: '',
        description: [''],
      }]
    }));
  };

  const removeExperience = (index: number) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const updateEducation = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, {
        institution: '',
        degree: '',
        field: '',
        start_date: '',
        end_date: '',
      }]
    }));
  };

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, {
        category: 'Technical Skills',
        items: '',
      }]
    }));
  };



  const validateJsonFile = (file: File): string | null => {
    if (!file.name.endsWith('.json')) {
      return 'Please select a JSON file (.json)';
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return 'File size must be less than 5MB';
    }
    return null;
  };

  const handleJsonFileUpload = async (file: File) => {
    const validationError = validateJsonFile(file);
    if (validationError) {
      onFormError(validationError);
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
    } catch (error) {
      onFormError(error instanceof Error ? error.message : 'Failed to parse JSON file');
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
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* JSON File Upload */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload JSON Resume Data</h3>
          <div className="space-y-4">
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
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
              
              <div className="flex flex-col items-center space-y-3">
                {isUploadingJson ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="text-gray-600">Reading JSON file...</p>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-8 h-8 text-gray-400"
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
                      <p className="text-sm font-medium text-gray-900">
                        Drop your JSON file here
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        or click to browse files
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">
                      Supports .json files (max 5MB)
                    </p>
                  </>
                )}
              </div>
            </div>
            
            {jsonUploadSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-green-800">JSON file loaded successfully! Form fields have been populated.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                              <input
                  type="text"
                  value={formData.personal.name}
                  onChange={(e) => updatePersonal('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  required
                />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                              <input
                  type="email"
                  value={formData.personal.email}
                  onChange={(e) => updatePersonal('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  required
                />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                              <input
                  type="tel"
                  value={formData.personal.phone}
                  onChange={(e) => updatePersonal('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                              <input
                  type="text"
                  value={formData.personal.location}
                  onChange={(e) => updatePersonal('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Professional Summary</label>
                          <textarea
                value={formData.personal.summary}
                onChange={(e) => updatePersonal('summary', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                placeholder="Brief professional summary..."
              />
          </div>

          {/* Social Links */}
          <div className="mt-4">
            <h4 className="text-md font-medium text-gray-900 mb-2">Social Links</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
                                  <input
                    type="url"
                    value={formData.personal.links.github}
                    onChange={(e) => updatePersonal('links', { ...formData.personal.links, github: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                                  <input
                    type="url"
                    value={formData.personal.links.linkedin}
                    onChange={(e) => updatePersonal('links', { ...formData.personal.links, linkedin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stack Overflow</label>
                                  <input
                    type="url"
                    value={formData.personal.links.stackoverflow}
                    onChange={(e) => updatePersonal('links', { ...formData.personal.links, stackoverflow: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Scholar</label>
                                  <input
                    type="url"
                    value={formData.personal.links.googlescholar}
                    onChange={(e) => updatePersonal('links', { ...formData.personal.links, googlescholar: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  />
              </div>
            </div>
          </div>
        </div>

        {/* Experience */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Experience</h3>
            <button
              type="button"
              onClick={addExperience}
              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Add Experience
            </button>
          </div>
          
          {formData.experience.map((exp, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-900">Experience {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeExperience(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <input
                    type="text"
                    value={exp.position}
                    onChange={(e) => updateExperience(index, 'position', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateExperience(index, 'company', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company URL</label>
                  <input
                    type="url"
                    value={exp.company_url}
                    onChange={(e) => updateExperience(index, 'company_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Description</label>
                  <input
                    type="text"
                    value={exp.company_description}
                    onChange={(e) => updateExperience(index, 'company_description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={exp.start_date}
                    onChange={(e) => updateExperience(index, 'start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={exp.end_date}
                    onChange={(e) => updateExperience(index, 'end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Achievements/Description</label>
                {exp.description.map((desc, descIndex) => (
                  <div key={descIndex} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={desc}
                      onChange={(e) => {
                        const newDescription = [...exp.description];
                        newDescription[descIndex] = e.target.value;
                        updateExperience(index, 'description', newDescription);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                      placeholder="Achievement or responsibility..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newDescription = exp.description.filter((_, i) => i !== descIndex);
                        updateExperience(index, 'description', newDescription);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newDescription = [...exp.description, ''];
                    updateExperience(index, 'description', newDescription);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Achievement
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Education */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Education</h3>
            <button
              type="button"
              onClick={addEducation}
              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Add Education
            </button>
          </div>
          
          {formData.education.map((edu, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-900">Education {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeEducation(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
                  <input
                    type="text"
                    value={edu.field}
                    onChange={(e) => updateEducation(index, 'field', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={edu.start_date}
                    onChange={(e) => updateEducation(index, 'start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={edu.end_date}
                    onChange={(e) => updateEducation(index, 'end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Skills */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
            <button
              type="button"
              onClick={addSkill}
              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Add Skill Category
            </button>
          </div>
          
          {formData.skills.map((skillGroup, skillGroupIndex) => (
            <div key={skillGroupIndex} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <input
                  type="text"
                  value={skillGroup.category}
                  onChange={(e) => {
                    const newSkills = [...formData.skills];
                    newSkills[skillGroupIndex] = { ...skillGroup, category: e.target.value };
                    setFormData(prev => ({ ...prev, skills: newSkills }));
                  }}
                  className="text-md font-medium text-gray-900 border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                  placeholder="Skill Category"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newSkills = formData.skills.filter((_, i) => i !== skillGroupIndex);
                    setFormData(prev => ({ ...prev, skills: newSkills }));
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove Category
                </button>
              </div>
              
              {/* Skills Textarea */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills (comma-separated)
                </label>
                <textarea
                  value={skillGroup.items}
                  onChange={(e) => {
                    const newSkills = [...formData.skills];
                    newSkills[skillGroupIndex] = { ...skillGroup, items: e.target.value };
                    setFormData(prev => ({ ...prev, skills: newSkills }));
                  }}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="e.g., JavaScript, React, Node.js, Python, Docker"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter skills separated by commas (e.g., JavaScript, React, Node.js)
                </p>
              </div>
            </div>
          ))}
        </div>


      </form>
    </div>
  );
} 