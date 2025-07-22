'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import AiSummaryImprover from './AiSummaryImprover';

interface ResumeFormData {
  personal: {
    name: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
    links: {
      website: string;
      github: string;
      stackoverflow: string;
      googlescholar: string;
      linkedin: string;
      twitter: string;
    };
  };
  experience: Array<{
    company: string;
    position: string;
    company_url: string;
    company_description: string;
    start_date: string;
    end_date: string;
    isCurrentRole: boolean;
    achievements: Array<{
      title: string;
      description: string;
    }>;
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
  isLoading?: boolean;
  externalFormData?: ResumeFormData | null;
  onFormDataChange?: (data: ResumeFormData) => void;
}

export default function ResumeForm({ 
  onFormSuccess, 
  onFormError, 
  onGenerateResume, 
  externalFormData,
  onFormDataChange
}: ResumeFormProps) {
  const [isPersonalInfoCollapsed, setIsPersonalInfoCollapsed] = useState(true);
  const [isExperienceCollapsed, setIsExperienceCollapsed] = useState(true);
  const [isEducationCollapsed, setIsEducationCollapsed] = useState(true);
  const [isSkillsCollapsed, setIsSkillsCollapsed] = useState(true);
  const [isAwardsCollapsed, setIsAwardsCollapsed] = useState(true);
  const [isCertificationsCollapsed, setIsCertificationsCollapsed] = useState(true);
  const [isPublicationsCollapsed, setIsPublicationsCollapsed] = useState(true);
  const summaryTextareaRef = useRef<HTMLTextAreaElement>(null);
  const experienceDescriptionRefs = useRef<(HTMLTextAreaElement | null)[][]>([]);
  const [formData, setFormData] = useState<ResumeFormData>({
    personal: {
      name: '',
      email: '',
      phone: '',
      location: '',
      summary: '',
      links: {
        website: '',
        github: '',
        stackoverflow: '',
        googlescholar: '',
        linkedin: '',
        twitter: '',
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
      setFormData(prevData => {
        // Only update if the data is actually different
        if (JSON.stringify(prevData) === JSON.stringify(externalFormData)) {
          return prevData; // Return same reference to prevent re-render
        }
        return externalFormData;
      });
    }
  }, [externalFormData]);

  // Notify parent when internal formData changes
  useEffect(() => {
    if (onFormDataChange) {
      onFormDataChange(formData);
    }
  }, [formData, onFormDataChange]);

  // Auto-resize textarea when summary changes
  useEffect(() => {
    // Only resize if personal info section is not collapsed
    if (!isPersonalInfoCollapsed && summaryTextareaRef.current) {
      const textarea = summaryTextareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px';
    }
  }, [formData.personal.summary, isPersonalInfoCollapsed]);

  // Auto-resize experience description textareas
  useEffect(() => {
    // Only resize if experience section is not collapsed
    if (!isExperienceCollapsed) {
      formData.experience.forEach((exp, expIndex) => {
        exp.achievements.forEach((desc, descIndex) => {
          const textarea = experienceDescriptionRefs.current[expIndex]?.[descIndex];
          if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px';
          }
        });
      });
    }
  }, [formData.experience, isExperienceCollapsed]);

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
        date_end: exp.isCurrentRole ? 'Present' : convertDateToAbbreviated(exp.end_date),
        achievements: exp.achievements
          .filter(achievement => achievement.title.trim() !== '' || achievement.description.trim() !== '')
          .map(achievement => {
            const title = achievement.title.trim();
            const description = achievement.description.trim();
            return {
              name: title,
              description: description
            };
          })
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
          { name: 'Website', url: data.personal.links.website },
          { name: 'GitHub', url: data.personal.links.github },
          { name: 'StackOverflow', url: data.personal.links.stackoverflow },
          { name: 'GoogleScholar', url: data.personal.links.googlescholar },
          { name: 'LinkedIn', url: data.personal.links.linkedin },
          { name: 'Twitter', url: data.personal.links.twitter }
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
    
    try {
      const jsonContent = convertToJson(formData);
      const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
      const jsonFile = new File([jsonBlob], 'resume.json', { type: 'application/json' });

      const result = await api.uploadJsonAndGenerate(jsonFile);
      onFormSuccess(result);
    } catch (error) {
      onFormError(error instanceof Error ? error.message : 'Failed to generate resume');
    }
  };



  const updatePersonal = (field: keyof ResumeFormData['personal'], value: string | ResumeFormData['personal']['links']) => {
    setFormData(prev => ({
      ...prev,
      personal: { ...prev.personal, [field]: value }
    }));
  };

  const updateExperience = (index: number, field: string, value: string | string[] | boolean | Array<{title: string; description: string}>) => {
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
        isCurrentRole: false,
        achievements: [
          { title: '', description: '' }
        ],
      }]
    }));
    setIsExperienceCollapsed(false);
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
    setIsEducationCollapsed(false);
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
    setIsSkillsCollapsed(false);
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







  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-0">


        {/* Personal Information */}
        <div className="rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={() => setIsPersonalInfoCollapsed(!isPersonalInfoCollapsed)}
              className="flex items-center space-x-3 flex-1 cursor-pointer bg-white p-2 rounded-lg transition-all duration-200 focus:outline-none"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200">
                <svg
                  className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                    isPersonalInfoCollapsed ? 'rotate-0' : 'rotate-180'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Professional Summary</label>
                </div>
                <textarea
                  ref={summaryTextareaRef}
                  value={formData.personal.summary}
                  onChange={(e) => {
                    updatePersonal('summary', e.target.value);
                  }}
                  rows={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 resize-none min-h-[40px] max-h-[300px] overflow-hidden"
                  placeholder="Brief professional summary..."
                />
                <div className="mt-2">
                  <AiSummaryImprover
                    currentSummary={formData.personal.summary}
                    onSummaryChange={(newSummary) => updatePersonal('summary', newSummary)}
                  />
                </div>
              </div>

              {/* Social Links */}
              <div className="mt-4 mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-2">Social Links</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      value={formData.personal.links.website}
                      onChange={(e) => updatePersonal('links', { ...formData.personal.links, website: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">X (Twitter)</label>
                    <input
                      type="url"
                      value={formData.personal.links.twitter}
                      onChange={(e) => updatePersonal('links', { ...formData.personal.links, twitter: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                      placeholder="https://x.com/yourusername"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Experience */}
        <div className="rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={() => setIsExperienceCollapsed(!isExperienceCollapsed)}
              className="flex items-center space-x-3 flex-1 cursor-pointer bg-white p-2 rounded-lg transition-all duration-200 focus:outline-none"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200">
                <svg
                  className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                    isExperienceCollapsed ? 'rotate-0' : 'rotate-180'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Experience</h3>
            </button>
            <button
              type="button"
              onClick={addExperience}
              className="flex items-center justify-center w-8 h-8 bg-green-100 border border-green-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 hover:bg-green-200"
            >
              <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          
          {!isExperienceCollapsed && formData.experience.map((exp, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <h4 className="text-md font-medium text-gray-900">Experience {index + 1}</h4>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={exp.isCurrentRole}
                      onChange={(e) => {
                        const isCurrentRole = e.target.checked;
                        // Update both isCurrentRole and end_date in a single state update
                        setFormData(prev => ({
                          ...prev,
                          experience: prev.experience.map((exp, i) =>
                            i === index ? { 
                              ...exp, 
                              isCurrentRole: isCurrentRole,
                              end_date: isCurrentRole ? 'Present' : ''
                            } : exp
                          )
                        }));
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    Current Role
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => removeExperience(index)}
                  className="flex items-center justify-center w-8 h-8 bg-red-100 border border-red-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 hover:bg-red-200"
                  title="Remove experience"
                >
                  <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
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
                {!exp.isCurrentRole && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={exp.end_date}
                      onChange={(e) => updateExperience(index, 'end_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                )}
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Achievements</label>
                {exp.achievements.map((achievement, achievementIndex) => (
                  <div key={achievementIndex} className="border border-gray-200 rounded-lg p-3 mb-3 relative">
                    <button
                      type="button"
                      onClick={() => {
                        const newAchievements = exp.achievements.filter((_, i) => i !== achievementIndex);
                        updateExperience(index, 'achievements', newAchievements);
                      }}
                      className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 bg-red-100 border border-red-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 hover:bg-red-200"
                      title="Remove achievement"
                    >
                      <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <div className="mb-2 pr-12">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Achievement Title</label>
                      <input
                        type="text"
                        value={achievement.title}
                        onChange={(e) => {
                          const newAchievements = [...exp.achievements];
                          newAchievements[achievementIndex] = { ...newAchievements[achievementIndex], title: e.target.value };
                          updateExperience(index, 'achievements', newAchievements);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                        placeholder="Achievement Title"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                      <textarea
                        ref={(el) => {
                          if (!experienceDescriptionRefs.current[index]) {
                            experienceDescriptionRefs.current[index] = [];
                          }
                          experienceDescriptionRefs.current[index][achievementIndex] = el;
                        }}
                        value={achievement.description}
                        onChange={(e) => {
                          const newAchievements = [...exp.achievements];
                          newAchievements[achievementIndex] = { ...newAchievements[achievementIndex], description: e.target.value };
                          updateExperience(index, 'achievements', newAchievements);
                        }}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 resize-none min-h-[40px] max-h-[300px] overflow-hidden"
                        placeholder="Achievement description..."
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newAchievements = [...exp.achievements, { title: '', description: '' }];
                    updateExperience(index, 'achievements', newAchievements);
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
        <div className="rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={() => setIsEducationCollapsed(!isEducationCollapsed)}
              className="flex items-center space-x-3 flex-1 cursor-pointer bg-white p-2 rounded-lg transition-all duration-200 focus:outline-none"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200">
                <svg
                  className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                    isEducationCollapsed ? 'rotate-0' : 'rotate-180'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Education</h3>
            </button>
            <button
              type="button"
              onClick={addEducation}
              className="flex items-center justify-center w-8 h-8 bg-green-100 border border-green-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 hover:bg-green-200"
            >
              <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          
          {!isEducationCollapsed && formData.education.map((edu, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-900">Education {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeEducation(index)}
                  className="flex items-center justify-center w-8 h-8 bg-red-100 border border-red-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 hover:bg-red-200"
                  title="Remove education"
                >
                  <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
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
        <div className="rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={() => setIsSkillsCollapsed(!isSkillsCollapsed)}
              className="flex items-center space-x-3 flex-1 cursor-pointer bg-white p-2 rounded-lg transition-all duration-200 focus:outline-none"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200">
                <svg
                  className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                    isSkillsCollapsed ? 'rotate-0' : 'rotate-180'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
            </button>
            <button
              type="button"
              onClick={addSkill}
              className="flex items-center justify-center w-8 h-8 bg-green-100 border border-green-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 hover:bg-green-200"
            >
              <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          
          {!isSkillsCollapsed && formData.skills.map((skillGroup, skillGroupIndex) => (
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
                  className="flex items-center justify-center w-8 h-8 bg-red-100 border border-red-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 hover:bg-red-200"
                  title="Remove skill category"
                >
                  <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
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
                    placeholder="Add a skill and hit Enter"
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
                        className="ml-1 flex items-center justify-center w-5 h-5 bg-red-100 border border-red-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 hover:bg-red-200"
                        title="Remove skill"
                      >
                        <svg className="w-3 h-3 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={() => setIsAwardsCollapsed(!isAwardsCollapsed)}
              className="flex items-center space-x-3 flex-1 cursor-pointer bg-white p-2 rounded-lg transition-all duration-200 focus:outline-none"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200">
                <svg
                  className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                    isAwardsCollapsed ? 'rotate-0' : 'rotate-180'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Awards</h3>
            </button>
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
                setIsAwardsCollapsed(false);
              }}
              className="flex items-center justify-center w-8 h-8 bg-green-100 border border-green-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 hover:bg-green-200"
            >
              <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          
          {!isAwardsCollapsed && formData.awards.map((award, index) => (
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
                  className="flex items-center justify-center w-8 h-8 bg-red-100 border border-red-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 hover:bg-red-200"
                  title="Remove award"
                >
                  <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
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
        <div className="rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={() => setIsCertificationsCollapsed(!isCertificationsCollapsed)}
              className="flex items-center space-x-3 flex-1 cursor-pointer bg-white p-2 rounded-lg transition-all duration-200 focus:outline-none"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200">
                <svg
                  className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                    isCertificationsCollapsed ? 'rotate-0' : 'rotate-180'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Certifications</h3>
            </button>
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
                setIsCertificationsCollapsed(false);
              }}
              className="flex items-center justify-center w-8 h-8 bg-green-100 border border-green-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 hover:bg-green-200"
            >
              <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          
          {!isCertificationsCollapsed && formData.certifications.map((cert, index) => (
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
                  className="flex items-center justify-center w-8 h-8 bg-red-100 border border-red-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 hover:bg-red-200"
                  title="Remove certification"
                >
                  <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
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
        <div className="rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={() => setIsPublicationsCollapsed(!isPublicationsCollapsed)}
              className="flex items-center space-x-3 flex-1 cursor-pointer bg-white p-2 rounded-lg transition-all duration-200 focus:outline-none"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200">
                <svg
                  className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                    isPublicationsCollapsed ? 'rotate-0' : 'rotate-180'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Publications</h3>
            </button>
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
                setIsPublicationsCollapsed(false);
              }}
              className="flex items-center justify-center w-8 h-8 bg-green-100 border border-green-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 hover:bg-green-200"
            >
              <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          
          {!isPublicationsCollapsed && formData.publications.map((pub, index) => (
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
                  className="flex items-center justify-center w-8 h-8 bg-red-100 border border-red-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 hover:bg-red-200"
                  title="Remove publication"
                >
                  <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
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