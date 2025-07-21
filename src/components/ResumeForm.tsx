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

interface ResumeFormProps {
  onFormSuccess: (result: { message: string; filename: string; download_url: string }) => void;
  onFormError: (error: string) => void;
  onGenerateResume?: () => void;
  onDownloadJson?: () => void;
  onDownloadPdf?: () => void;
  isLoading?: boolean;
  externalFormData?: ResumeFormData | null;
  onFormDataChange?: (data: ResumeFormData) => void;
}

export default function ResumeForm({ 
  onFormSuccess, 
  onFormError, 
  onGenerateResume, 
  onDownloadJson, 
  onDownloadPdf, 
  isLoading: externalIsLoading,
  externalFormData,
  onFormDataChange
}: ResumeFormProps) {
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const isLoading = externalIsLoading !== undefined ? externalIsLoading : internalIsLoading;
  const [isUploadingJson, setIsUploadingJson] = useState(false);
  const [jsonUploadSuccess, setJsonUploadSuccess] = useState(false);
  const [isPersonalInfoCollapsed, setIsPersonalInfoCollapsed] = useState(true);
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
    experience: [],
    education: [],
    skills: [],
    awards: [],
    certifications: [],
    publications: [],
  });



  // Update internal formData when externalFormData changes
  useEffect(() => {
    if (externalFormData) {
      setFormData(externalFormData);
    }
  }, [externalFormData]);

  // Notify parent when internal formData changes
  useEffect(() => {
    if (onFormDataChange) {
      onFormDataChange(formData);
    }
  }, [formData, onFormDataChange]);

  const convertDateToAbbreviated = (dateString: string): string => {
    if (!dateString || dateString === 'Present') return dateString;
    
    // Handle ISO format "yyyy-mm-dd" directly to avoid timezone issues
    const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1]);
      const month = parseInt(isoMatch[2]) - 1; // Convert to 0-based index
      const day = parseInt(isoMatch[3]);
      
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
          items: Array.isArray(skillGroup.items) ? skillGroup.items as string[] : 
                 typeof skillGroup.items === 'string' ? skillGroup.items.split(',').map(s => s.trim()).filter(s => s) : [],
        })),
        awards: ((data.awards as Array<Record<string, unknown>>) || []).map((award) => ({
          title: (award.title as string) || '',
          organization: (award.organization as string) || '',
          organization_detail: (award.organization_detail as string) || '',
          organization_url: (award.organization_url as string) || '',
          location: (award.location as string) || '',
          date: convertAbbreviatedDateToFormDate((award.date as string) || ''),
        })),
        certifications: ((data.certifications as Array<Record<string, unknown>>) || []).map((cert) => ({
          title: (cert.title as string) || '',
          organization: (cert.organization as string) || '',
          url: (cert.url as string) || '',
          date: convertAbbreviatedDateToFormDate((cert.date as string) || ''),
        })),
        publications: ((data.publications as Array<Record<string, unknown>>) || []).map((pub) => ({
          authors: (pub.authors as string) || '',
          title: (pub.title as string) || '',
          venue: (pub.venue as string) || '',
          date: (pub.year as number)?.toString() || convertAbbreviatedDateToFormDate((pub.date as string) || ''),
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
        date_end: exp.end_date === 'Present' ? 'Present' : convertDateToAbbreviated(exp.end_date),
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
      .filter(skillGroup => skillGroup.items.length > 0)
      .map(skillGroup => ({
        category: skillGroup.category,
        items: skillGroup.items
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
        category: `Skill Category ${prev.skills.length + 1}`,
        items: [],
      }]
    }));
  };

  const addSkillTag = (skillGroupIndex: number, skill: string) => {
    if (!skill.trim()) return;
    
    const skillGroup = formData.skills[skillGroupIndex];
    const currentSkills = skillGroup.items || [];
    
    if (!currentSkills.includes(skill.trim())) {
      const newSkills = [...formData.skills];
      newSkills[skillGroupIndex] = {
        ...skillGroup,
        items: [...currentSkills, skill.trim()]
      };
      setFormData(prev => ({ ...prev, skills: newSkills }));
    }
  };

  const removeSkillTag = (skillGroupIndex: number, skillToRemove: string) => {
    const skillGroup = formData.skills[skillGroupIndex];
    const currentSkills = skillGroup.items || [];
    const updatedSkills = currentSkills.filter(skill => skill !== skillToRemove);
    
    const newSkills = [...formData.skills];
    newSkills[skillGroupIndex] = {
      ...skillGroup,
      items: updatedSkills
    };
    setFormData(prev => ({ ...prev, skills: newSkills }));
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
      // Explicitly notify parent of the new form data
      if (onFormDataChange) {
        onFormDataChange(parsedData);
      }
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


        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            <button
              type="button"
              onClick={() => setIsPersonalInfoCollapsed(!isPersonalInfoCollapsed)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isPersonalInfoCollapsed 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              <span className="text-sm font-semibold">
                {isPersonalInfoCollapsed ? 'Expand Personal Info' : 'Collapse Personal Info'}
              </span>
              <svg
                className={`w-5 h-5 transition-transform duration-200 ${
                  isPersonalInfoCollapsed ? 'rotate-0' : 'rotate-180'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {!isPersonalInfoCollapsed && (
            <>
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
            </>
          )}
        </div>

        {/* Experience */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Experience</h3>
            <button
              type="button"
              onClick={addExperience}
              className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 border border-green-300 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <span className="text-sm font-semibold">Add Experience</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
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
              className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 border border-green-300 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <span className="text-sm font-semibold">Add Education</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
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
              className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 border border-green-300 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <span className="text-sm font-semibold">Add Skill Category</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
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
                  className="text-md font-medium text-gray-900 border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-3 py-2 shadow-sm"
                  placeholder="e.g., Technical Skills"
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
              
              {/* Skills Tags */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills
                </label>
                
                {/* Skill Input */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Add a skill..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const target = e.target as HTMLInputElement;
                        addSkillTag(skillGroupIndex, target.value);
                        target.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addSkillTag(skillGroupIndex, input.value);
                      input.value = '';
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 border border-green-300 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <span className="text-sm font-semibold">Add</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                
                {/* Skill Tags */}
                <div className="flex flex-wrap gap-2">
                  {skillGroup.items && skillGroup.items.length > 0 ? skillGroup.items.map((skill, skillIndex) => (
                    <div
                      key={skillIndex}
                      className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkillTag(skillGroupIndex, skill)}
                        className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )) : null}
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  Type a skill and press Enter or click Add to add it as a tag
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Awards */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Awards</h3>
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  awards: [...prev.awards, {
                    title: '',
                    organization: '',
                    organization_detail: '',
                    organization_url: '',
                    location: '',
                    date: '',
                  }]
                }));
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 border border-green-300 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <span className="text-sm font-semibold">Add Award</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          
          {formData.awards.map((award, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-900">Award {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      awards: prev.awards.filter((_, i) => i !== index)
                    }));
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Award Title</label>
                  <input
                    type="text"
                    value={award.title}
                    onChange={(e) => {
                      const newAwards = [...formData.awards];
                      newAwards[index] = { ...award, title: e.target.value };
                      setFormData(prev => ({ ...prev, awards: newAwards }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="e.g., Best Paper Award"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                  <input
                    type="text"
                    value={award.organization}
                    onChange={(e) => {
                      const newAwards = [...formData.awards];
                      newAwards[index] = { ...award, organization: e.target.value };
                      setFormData(prev => ({ ...prev, awards: newAwards }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="e.g., International Conference on ML"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization Detail</label>
                  <input
                    type="text"
                    value={award.organization_detail}
                    onChange={(e) => {
                      const newAwards = [...formData.awards];
                      newAwards[index] = { ...award, organization_detail: e.target.value };
                      setFormData(prev => ({ ...prev, awards: newAwards }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="e.g., Advanced Techniques in Time Series Forecasting"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization URL</label>
                  <input
                    type="url"
                    value={award.organization_url}
                    onChange={(e) => {
                      const newAwards = [...formData.awards];
                      newAwards[index] = { ...award, organization_url: e.target.value };
                      setFormData(prev => ({ ...prev, awards: newAwards }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={award.location}
                    onChange={(e) => {
                      const newAwards = [...formData.awards];
                      newAwards[index] = { ...award, location: e.target.value };
                      setFormData(prev => ({ ...prev, awards: newAwards }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="e.g., Online, New York, NY"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={award.date}
                    onChange={(e) => {
                      const newAwards = [...formData.awards];
                      newAwards[index] = { ...award, date: e.target.value };
                      setFormData(prev => ({ ...prev, awards: newAwards }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Certifications</h3>
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  certifications: [...prev.certifications, {
                    title: '',
                    organization: '',
                    url: '',
                    date: '',
                  }]
                }));
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 border border-green-300 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <span className="text-sm font-semibold">Add Certification</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          
          {formData.certifications.map((cert, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-900">Certification {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      certifications: prev.certifications.filter((_, i) => i !== index)
                    }));
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Certification Title</label>
                  <input
                    type="text"
                    value={cert.title}
                    onChange={(e) => {
                      const newCerts = [...formData.certifications];
                      newCerts[index] = { ...cert, title: e.target.value };
                      setFormData(prev => ({ ...prev, certifications: newCerts }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="e.g., AWS Certified Machine Learning - Specialty"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                  <input
                    type="text"
                    value={cert.organization}
                    onChange={(e) => {
                      const newCerts = [...formData.certifications];
                      newCerts[index] = { ...cert, organization: e.target.value };
                      setFormData(prev => ({ ...prev, certifications: newCerts }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="e.g., Amazon Web Services"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  <input
                    type="url"
                    value={cert.url}
                    onChange={(e) => {
                      const newCerts = [...formData.certifications];
                      newCerts[index] = { ...cert, url: e.target.value };
                      setFormData(prev => ({ ...prev, certifications: newCerts }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="https://aws.amazon.com/certification/"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={cert.date}
                    onChange={(e) => {
                      const newCerts = [...formData.certifications];
                      newCerts[index] = { ...cert, date: e.target.value };
                      setFormData(prev => ({ ...prev, certifications: newCerts }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Publications */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Publications</h3>
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  publications: [...prev.publications, {
                    authors: '',
                    title: '',
                    venue: '',
                    date: '',
                    url: '',
                  }]
                }));
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 border border-green-300 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <span className="text-sm font-semibold">Add Publication</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          
          {formData.publications.map((pub, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-900">Publication {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      publications: prev.publications.filter((_, i) => i !== index)
                    }));
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Authors</label>
                  <input
                    type="text"
                    value={pub.authors}
                    onChange={(e) => {
                      const newPubs = [...formData.publications];
                      newPubs[index] = { ...pub, authors: e.target.value };
                      setFormData(prev => ({ ...prev, publications: newPubs }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="e.g., Doe, J., Smith, A., Johnson, B."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={pub.title}
                    onChange={(e) => {
                      const newPubs = [...formData.publications];
                      newPubs[index] = { ...pub, title: e.target.value };
                      setFormData(prev => ({ ...prev, publications: newPubs }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="e.g., Hybrid Approaches to Time Series Forecasting in Financial Markets"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                  <input
                    type="text"
                    value={pub.venue}
                    onChange={(e) => {
                      const newPubs = [...formData.publications];
                      newPubs[index] = { ...pub, venue: e.target.value };
                      setFormData(prev => ({ ...prev, publications: newPubs }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="e.g., Journal of Applied Data Science, Vol. 15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={pub.date}
                    onChange={(e) => {
                      const newPubs = [...formData.publications];
                      newPubs[index] = { ...pub, date: e.target.value };
                      setFormData(prev => ({ ...prev, publications: newPubs }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="2023"
                    min="1900"
                    max="2030"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  <input
                    type="url"
                    value={pub.url}
                    onChange={(e) => {
                      const newPubs = [...formData.publications];
                      newPubs[index] = { ...pub, url: e.target.value };
                      setFormData(prev => ({ ...prev, publications: newPubs }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="https://example.com/journal/jads/vol15"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>



      </form>
    </div>
  );
} 