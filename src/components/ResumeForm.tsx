'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';

interface ResumeFormData {
  personal: {
    name: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
  };
  experience: Array<{
    company: string;
    position: string;
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
  skills: string[];
}

interface ResumeFormProps {
  onFormSuccess: (result: any) => void;
  onFormError: (error: string) => void;
}

export default function ResumeForm({ onFormSuccess, onFormError }: ResumeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ResumeFormData>({
    personal: {
      name: '',
      email: '',
      phone: '',
      location: '',
      summary: '',
    },
    experience: [
      {
        company: '',
        position: '',
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
    skills: [''],
  });

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

  const convertToYaml = (data: ResumeFormData): string => {
    // Convert experience to the correct format
    const experience = data.experience
      .filter(exp => exp.company && exp.position)
      .map(exp => ({
        title: exp.position,
        company: exp.company,
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
    const skills = [
      {
        category: 'Technical Skills',
        items: data.skills.filter(skill => skill.trim() !== '')
      }
    ];



    // Build the YAML content
    let yamlContent = `---
name: ${data.personal.name}
contact:
  phone: ${data.personal.phone}
  email: ${data.personal.email}
  location: ${data.personal.location}

summary: >
  ${data.personal.summary}

skills:
`;

    // Add skills
    skills.forEach(skillGroup => {
      yamlContent += `  - category: ${skillGroup.category}
    items: ${skillGroup.items.join(', ')}
`;
    });

    yamlContent += `
experience:
`;

    // Add experience
    experience.forEach(exp => {
      yamlContent += `  - title: ${exp.title}
    company: ${exp.company}
    location: ${exp.location}
    date_start: ${exp.date_start}
    date_end: ${exp.date_end}
    achievements:
`;
      exp.achievements.forEach(achievement => {
        yamlContent += `      - name: ${achievement.name}
        description: ${achievement.description}
`;
      });
      yamlContent += '\n';
    });

    yamlContent += `education:
`;

    // Add education
    education.forEach(edu => {
      yamlContent += `  - degree: ${edu.degree}
    institution: ${edu.institution}
    location: ${edu.location}
    date_start: ${edu.date_start}
    date_end: ${edu.date_end}

`;
    });



    yamlContent += '---';

    return yamlContent;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const yamlContent = convertToYaml(formData);
      const yamlBlob = new Blob([yamlContent], { type: 'text/yaml' });
      const yamlFile = new File([yamlBlob], 'resume.yaml', { type: 'text/yaml' });

      const result = await api.uploadYamlAndGenerate(yamlFile);
      onFormSuccess(result);
    } catch (error) {
      onFormError(error instanceof Error ? error.message : 'Failed to generate resume');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadYaml = () => {
    const yamlContent = convertToYaml(formData);
    const yamlBlob = new Blob([yamlContent], { type: 'text/yaml' });
    
    // Create download link for the YAML file
    const downloadUrl = URL.createObjectURL(yamlBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.download = 'resume.yaml';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(downloadUrl);
  };

  const updatePersonal = (field: keyof ResumeFormData['personal'], value: string) => {
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
        gpa: '',
      }]
    }));
  };

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const updateSkills = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) => i === index ? value : skill)
    }));
  };

  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, '']
    }));
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };



  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Create Your Resume</h3>
        <p className="text-gray-600">Fill out the form below to generate your professional resume</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Personal Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.personal.name}
                onChange={(e) => updatePersonal('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.personal.email}
                onChange={(e) => updatePersonal('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.personal.phone}
                onChange={(e) => updatePersonal('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.personal.location}
                onChange={(e) => updatePersonal('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                placeholder="San Francisco, CA"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Professional Summary *
            </label>
            <textarea
              required
              rows={3}
              value={formData.personal.summary}
              onChange={(e) => updatePersonal('summary', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              placeholder="Experienced software engineer with 5+ years of expertise in..."
            />
          </div>
        </div>

        {/* Experience */}
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
            <h4 className="text-lg font-semibold text-gray-900">Work Experience</h4>
            <button
              type="button"
              onClick={addExperience}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Add Experience
            </button>
          </div>
          {formData.experience.map((exp, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h5 className="font-medium text-gray-900">Experience {index + 1}</h5>
                {formData.experience.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExperience(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company *
                  </label>
                  <input
                    type="text"
                    required
                    value={exp.company}
                    onChange={(e) => updateExperience(index, 'company', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="Tech Corp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position *
                  </label>
                  <input
                    type="text"
                    required
                    value={exp.position}
                    onChange={(e) => updateExperience(index, 'position', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="Senior Software Engineer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={exp.start_date}
                    onChange={(e) => updateExperience(index, 'start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={exp.end_date}
                    onChange={(e) => updateExperience(index, 'end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                {exp.description.map((desc, descIndex) => (
                  <div key={descIndex} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={desc}
                      onChange={(e) => {
                        const newDesc = [...exp.description];
                        newDesc[descIndex] = e.target.value;
                        updateExperience(index, 'description', newDesc);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                      placeholder="• Led development of..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newDesc = exp.description.filter((_, i) => i !== descIndex);
                        updateExperience(index, 'description', newDesc);
                      }}
                      className="text-red-600 hover:text-red-800 px-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newDesc = [...exp.description, ''];
                    updateExperience(index, 'description', newDesc);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add bullet point
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Education */}
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
            <h4 className="text-lg font-semibold text-gray-900">Education</h4>
            <button
              type="button"
              onClick={addEducation}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Add Education
            </button>
          </div>
          {formData.education.map((edu, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h5 className="font-medium text-gray-900">Education {index + 1}</h5>
                {formData.education.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEducation(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Institution *
                  </label>
                  <input
                    type="text"
                    required
                    value={edu.institution}
                    onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="University of California"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Degree *
                  </label>
                  <input
                    type="text"
                    required
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="Bachelor of Science"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field of Study *
                  </label>
                  <input
                    type="text"
                    required
                    value={edu.field}
                    onChange={(e) => updateEducation(index, 'field', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="Computer Science"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={edu.start_date}
                    onChange={(e) => updateEducation(index, 'start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={edu.end_date}
                    onChange={(e) => updateEducation(index, 'end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Skills */}
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
            <h4 className="text-lg font-semibold text-gray-900">Skills</h4>
            <button
              type="button"
              onClick={addSkill}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Add Skill
            </button>
          </div>
          <div className="space-y-2">
            {formData.skills.map((skill, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={skill}
                  onChange={(e) => updateSkills(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="JavaScript, React, Node.js"
                />
                {formData.skills.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="text-red-600 hover:text-red-800 px-3"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>



        {/* Action Buttons */}
        <div className="pt-6 border-t border-gray-200 space-y-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Resume...
              </>
            ) : (
              'Generate Resume'
            )}
          </button>
          
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleDownloadYaml}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download YAML
            </button>
            
            <div className="text-center text-sm text-gray-500 flex items-center">
              <span>Save your data for later</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
} 