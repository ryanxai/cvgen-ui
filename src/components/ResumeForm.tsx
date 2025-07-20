'use client';

import React, { useState, useRef } from 'react';
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
}

export default function ResumeForm({ onFormSuccess, onFormError }: ResumeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
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
        items: [''],
      },
    ],
    awards: [],
    certifications: [],
    publications: [],
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
      const data = JSON.parse(jsonContent);
      const formData: ResumeFormData = {
        personal: {
          name: data.name || '',
          email: data.contact?.email || '',
          phone: data.contact?.phone || '',
          location: data.contact?.location || '',
          summary: data.summary || '',
          links: {
            github: data.contact?.links?.find((link: any) => link.name === 'GitHub')?.url || '',
            stackoverflow: data.contact?.links?.find((link: any) => link.name === 'StackOverflow')?.url || '',
            googlescholar: data.contact?.links?.find((link: any) => link.name === 'GoogleScholar')?.url || '',
            linkedin: data.contact?.links?.find((link: any) => link.name === 'LinkedIn')?.url || '',
          },
        },
        experience: data.experience?.map((exp: any) => ({
          company: exp.company || '',
          position: exp.title || '',
          company_url: exp.company_url || '',
          company_description: exp.company_description || '',
          start_date: convertAbbreviatedDateToFormDate(exp.date_start || ''),
          end_date: exp.date_end === 'Present' ? 'Present' : convertAbbreviatedDateToFormDate(exp.date_end || ''),
          description: exp.achievements?.map((achievement: any) => achievement.description || '') || [''],
        })) || [],
        education: data.education?.map((edu: any) => ({
          institution: edu.institution || '',
          degree: edu.degree || '',
          field: '',
          start_date: convertAbbreviatedDateToFormDate(edu.date_start || ''),
          end_date: convertAbbreviatedDateToFormDate(edu.date_end || ''),
        })) || [],
        skills: data.skills?.map((skillGroup: any) => ({
          category: skillGroup.category || '',
          items: typeof skillGroup.items === 'string' ? skillGroup.items.split(', ') : skillGroup.items || [''],
        })) || [],
        awards: data.awards?.map((award: any) => ({
          title: award.title || '',
          organization: award.organization || '',
          organization_detail: award.organization_detail || '',
          organization_url: award.organization_url || '',
          location: award.location || '',
          date: award.date || '',
        })) || [],
        certifications: data.certifications?.map((cert: any) => ({
          title: cert.title || '',
          organization: cert.organization || '',
          url: cert.url || '',
          date: cert.date || '',
        })) || [],
        publications: data.publications?.map((pub: any) => ({
          authors: pub.authors || '',
          title: pub.title || '',
          venue: pub.venue || '',
          date: pub.year?.toString() || '',
          url: pub.url || '',
        })) || [],
      };
        const line = lines[i].trim();
        const originalLine = lines[i];
        
        if (line.startsWith('name:')) {
          formData.personal.name = line.substring(5).trim();
        } else if (line.startsWith('contact:')) {
          currentSection = 'contact';
        } else if (originalLine.startsWith('  phone:')) {
          formData.personal.phone = originalLine.substring(8).trim();
        } else if (originalLine.startsWith('  email:')) {
          formData.personal.email = originalLine.substring(8).trim();
        } else if (originalLine.startsWith('  location:')) {
          formData.personal.location = originalLine.substring(11).trim();
        } else if (originalLine.startsWith('  links:')) {
          currentSection = 'links';
        } else if (originalLine.startsWith('    - name: GitHub')) {
          // Look for the URL on the next line
          if (i + 1 < lines.length && lines[i + 1].trim().startsWith('url:')) {
            formData.personal.links.github = lines[i + 1].trim().substring(5).trim();
          }
        } else if (originalLine.startsWith('    - name: LinkedIn')) {
          if (i + 1 < lines.length && lines[i + 1].trim().startsWith('url:')) {
            formData.personal.links.linkedin = lines[i + 1].trim().substring(5).trim();
          }
        } else if (originalLine.startsWith('    - name: StackOverflow')) {
          if (i + 1 < lines.length && lines[i + 1].trim().startsWith('url:')) {
            formData.personal.links.stackoverflow = lines[i + 1].trim().substring(5).trim();
          }
        } else if (originalLine.startsWith('    - name: GoogleScholar')) {
          if (i + 1 < lines.length && lines[i + 1].trim().startsWith('url:')) {
            formData.personal.links.googlescholar = lines[i + 1].trim().substring(5).trim();
          }
        } else if (line.startsWith('summary:')) {
          currentSection = 'summary';
          // Collect multi-line summary
          const summaryLines = [];
          let j = i + 1;
          while (j < lines.length && (lines[j].startsWith('  ') || lines[j].trim() === '')) {
            if (lines[j].trim() !== '') {
              summaryLines.push(lines[j].trim());
            }
            j++;
          }
          formData.personal.summary = summaryLines.join(' ');
        } else if (line.startsWith('skills:')) {
          currentSection = 'skills';
        } else if (originalLine.startsWith('  - category:')) {
          const category = originalLine.substring(13).trim();
          currentSkillGroup = { category, items: [] };
          formData.skills.push(currentSkillGroup);
        } else if (originalLine.startsWith('    items:') && currentSkillGroup) {
          const items = originalLine.substring(10).trim();
          currentSkillGroup.items = items.split(',').map(item => item.trim());
        } else if (line.startsWith('experience:')) {
          currentSection = 'experience';
        } else if (originalLine.startsWith('  - title:') && currentSection === 'experience') {
          const title = originalLine.substring(10).trim();
          currentExperience = {
            position: title,
            company: '',
            company_url: '',
            company_description: '',
            start_date: '',
            end_date: '',
            description: [],
          };
          formData.experience.push(currentExperience);
        } else if (originalLine.startsWith('    company:') && currentExperience) {
          currentExperience.company = originalLine.substring(12).trim();
        } else if (originalLine.startsWith('    company_url:') && currentExperience) {
          currentExperience.company_url = originalLine.substring(16).trim();
        } else if (originalLine.startsWith('    company_description:') && currentExperience) {
          currentExperience.company_description = originalLine.substring(24).trim();
        } else if (originalLine.startsWith('    date_start:') && currentExperience) {
          const dateValue = originalLine.substring(15).trim();
          currentExperience.start_date = convertAbbreviatedDateToFormDate(dateValue);
        } else if (originalLine.startsWith('    date_end:') && currentExperience) {
          const dateValue = originalLine.substring(13).trim();
          currentExperience.end_date = convertAbbreviatedDateToFormDate(dateValue);
        } else if (line.startsWith('    achievements:') && currentExperience) {
          // Parse achievements
          let j = i + 1;
          while (j < lines.length && lines[j].startsWith('      -')) {
            const achievementLine = lines[j].trim();
            if (achievementLine.startsWith('- name:')) {
              const name = achievementLine.substring(7).trim();
              if (j + 1 < lines.length && lines[j + 1].trim().startsWith('description:')) {
                const description = lines[j + 1].trim().substring(12).trim();
                currentExperience.description.push(`${name}: ${description}`);
                j++;
              } else {
                currentExperience.description.push(name);
              }
            }
            j++;
          }
        } else if (line.startsWith('education:')) {
          currentSection = 'education';
        } else if (originalLine.startsWith('  - degree:') && currentSection === 'education') {
          const degree = originalLine.substring(11).trim();
          // Handle complex degree strings like "B.S. in Computer Science, Minor in Statistics"
          let degreeName = degree;
          let fieldName = '';
          
          if (degree.includes(' in ')) {
            const parts = degree.split(' in ');
            degreeName = parts[0];
            fieldName = parts.slice(1).join(' in '); // Join remaining parts in case there are multiple "in"
          }
          
          currentEducation = {
            degree: degreeName || '',
            field: fieldName || '',
            institution: '',
            start_date: '',
            end_date: '',
          };
          formData.education.push(currentEducation);
        } else if (originalLine.startsWith('    institution:') && currentEducation) {
          currentEducation.institution = originalLine.substring(16).trim();
        } else if (originalLine.startsWith('    date_start:') && currentEducation) {
          const dateValue = originalLine.substring(15).trim();
          currentEducation.start_date = convertAbbreviatedDateToFormDate(dateValue);
        } else if (originalLine.startsWith('    date_end:') && currentEducation) {
          const dateValue = originalLine.substring(13).trim();
          currentEducation.end_date = convertAbbreviatedDateToFormDate(dateValue);
        } else if (line.startsWith('awards:') && currentSection !== 'awards') {
          currentSection = 'awards';
        } else if (originalLine.startsWith('  - title:') && currentSection === 'awards') {
          const title = originalLine.substring(10).trim();
          currentAward = {
            title,
            organization: '',
            organization_detail: '',
            organization_url: '',
            location: '',
            date: '',
          };
          formData.awards.push(currentAward);
        } else if (originalLine.startsWith('    organization:') && currentAward) {
          currentAward.organization = originalLine.substring(16).trim();
        } else if (originalLine.startsWith('    organization_detail:') && currentAward) {
          currentAward.organization_detail = originalLine.substring(23).trim();
        } else if (originalLine.startsWith('    organization_url:') && currentAward) {
          currentAward.organization_url = originalLine.substring(20).trim();
        } else if (originalLine.startsWith('    location:') && currentAward) {
          currentAward.location = originalLine.substring(12).trim();
        } else if (originalLine.startsWith('    date:') && currentAward) {
          const dateValue = originalLine.substring(7).trim();
          currentAward.date = convertAbbreviatedDateToFormDate(dateValue);
        } else if (line.startsWith('certifications:') && currentSection !== 'certifications') {
          currentSection = 'certifications';
        } else if (originalLine.startsWith('  - title:') && currentSection === 'certifications') {
          const title = originalLine.substring(10).trim();
          currentCertification = {
            title,
            organization: '',
            url: '',
            date: '',
          };
          formData.certifications.push(currentCertification);
        } else if (originalLine.startsWith('    organization:') && currentCertification) {
          currentCertification.organization = originalLine.substring(16).trim();
        } else if (originalLine.startsWith('    url:') && currentCertification) {
          currentCertification.url = originalLine.substring(7).trim();
        } else if (originalLine.startsWith('    date:') && currentCertification) {
          const dateValue = originalLine.substring(7).trim();
          currentCertification.date = convertAbbreviatedDateToFormDate(dateValue);
        } else if (line.startsWith('publications:') && currentSection !== 'publications') {
          currentSection = 'publications';
        } else if (originalLine.startsWith('  - authors:') && currentSection === 'publications') {
          const authors = originalLine.substring(11).trim();
          currentPublication = {
            authors,
            title: '',
            venue: '',
            date: '',
            url: '',
          };
          formData.publications.push(currentPublication);
        } else if (originalLine.startsWith('    title:') && currentPublication) {
          currentPublication.title = originalLine.substring(9).trim();
        } else if (originalLine.startsWith('    venue:') && currentPublication) {
          currentPublication.venue = originalLine.substring(9).trim();
        } else if (originalLine.startsWith('    date:') && currentPublication) {
          const dateValue = originalLine.substring(7).trim();
          currentPublication.date = convertAbbreviatedDateToFormDate(dateValue);
      return formData;
    } catch (error) {
      throw new Error('Failed to parse JSON file. Please check the format.');
    }
  };

  const convertToYaml = (data: ResumeFormData): string => {
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
      .filter(skillGroup => skillGroup.items.some(item => item.trim() !== ''))
      .map(skillGroup => ({
        category: skillGroup.category,
        items: skillGroup.items.filter(item => item.trim() !== '')
      }));



    // Build the YAML content
    let yamlContent = `---
name: ${data.personal.name}
contact:
  phone: ${data.personal.phone}
  email: ${data.personal.email}
  location: ${data.personal.location}
  links:
    - name: GitHub
      url: ${data.personal.links.github}
    - name: StackOverflow
      url: ${data.personal.links.stackoverflow}
    - name: GoogleScholar
      url: ${data.personal.links.googlescholar}
    - name: LinkedIn
      url: ${data.personal.links.linkedin}

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
    company_url: ${exp.company_url}
    company_description: ${exp.company_description}
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

    // Add awards if any
    if (data.awards.length > 0) {
      yamlContent += `awards:
`;
      data.awards.forEach(award => {
        yamlContent += `  - title: ${award.title}
    organization: ${award.organization}
    organization_detail: ${award.organization_detail}
    organization_url: ${award.organization_url}
    location: ${award.location}
    date: ${convertDateToAbbreviated(award.date)}

`;
      });
    }

    // Add certifications if any
    if (data.certifications.length > 0) {
      yamlContent += `certifications:
`;
      data.certifications.forEach(cert => {
        yamlContent += `  - title: ${cert.title}
    organization: ${cert.organization}
    url: ${cert.url}
    date: ${convertDateToAbbreviated(cert.date)}

`;
      });
    }

    // Add publications if any
    if (data.publications.length > 0) {
      yamlContent += `publications:
`;
      data.publications.forEach(pub => {
        yamlContent += `  - authors: ${pub.authors}
    title: ${pub.title}
    venue: ${pub.venue}
    date: ${convertDateToAbbreviated(pub.date)}
    url: ${pub.url}

`;
      });
    }

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

  const handleDownloadResume = async () => {
    setIsLoading(true);
    
    try {
      const yamlContent = convertToYaml(formData);
      const yamlBlob = new Blob([yamlContent], { type: 'text/yaml' });
      const yamlFile = new File([yamlBlob], 'resume.yaml', { type: 'text/yaml' });

      const result = await api.uploadYamlAndGenerate(yamlFile);
      
      // Download the generated PDF
      const pdfBlob = await api.downloadPdf(result.filename);
      
      // Create download link for the PDF file
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `resume_${formData.personal.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadUrl);
      
      // Show success message
      onFormSuccess(result);
    } catch (error) {
      onFormError(error instanceof Error ? error.message : 'Failed to download resume');
    } finally {
      setIsLoading(false);
    }
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

  const updateSkills = (skillGroupIndex: number, itemIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map((skillGroup, i) =>
        i === skillGroupIndex
          ? {
              ...skillGroup,
              items: skillGroup.items.map((item, j) => j === itemIndex ? value : item)
            }
          : skillGroup
      )
    }));
  };

  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, {
        category: 'Technical Skills',
        items: [''],
      }]
    }));
  };

  const removeSkill = (skillGroupIndex: number, itemIndex: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map((skillGroup, i) =>
        i === skillGroupIndex
          ? {
              ...skillGroup,
              items: skillGroup.items.filter((_, j) => j !== itemIndex)
            }
          : skillGroup
      ).filter(skillGroup => skillGroup.items.length > 0)
    }));
  };

  const validateYamlFile = (file: File): string | null => {
    if (!file.name.endsWith('.yaml') && !file.name.endsWith('.yml')) {
      return 'Please select a YAML file (.yaml or .yml)';
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return 'File size must be less than 5MB';
    }
    return null;
  };

  const handleYamlFileUpload = async (file: File) => {
    const validationError = validateYamlFile(file);
    if (validationError) {
      onFormError(validationError);
      return;
    }

    setIsUploadingYaml(true);
    try {
      const text = await file.text();
      const parsedData = parseYamlToFormData(text);
      setFormData(parsedData);
      setYamlUploadSuccess(true);
      // Clear success message after 3 seconds
      setTimeout(() => setYamlUploadSuccess(false), 3000);
    } catch (error) {
      onFormError(error instanceof Error ? error.message : 'Failed to parse YAML file');
    } finally {
      setIsUploadingYaml(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleYamlFileUpload(files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };



  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Create Your Resume</h3>
        <p className="text-gray-600">Fill out the form below to generate your professional resume</p>
      </div>

      {/* YAML File Upload Section */}
      <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">Load from YAML File</h4>
            <p className="text-sm text-gray-600">Upload a pre-filled resume.yaml file to populate the form</p>
          </div>
          <button
            type="button"
            onClick={openFileDialog}
            disabled={isUploadingYaml}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
          >
            {isUploadingYaml ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload YAML
              </>
            )}
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".yaml,.yml"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploadingYaml}
        />
        
        {/* Success Message */}
        {yamlUploadSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium text-green-800">
                YAML file loaded successfully! The form has been populated with your data.
              </span>
            </div>
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          <p>• Supports .yaml and .yml files (max 5MB)</p>
          <p>• The form will be populated with the YAML content</p>
          <p>• You can still edit the form after loading</p>
        </div>
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

          {/* Links Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Professional Links
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub URL
                </label>
                <input
                  type="url"
                  value={formData.personal.links.github}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      personal: {
                        ...prev.personal,
                        links: { ...prev.personal.links, github: e.target.value }
                      }
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="https://github.com/username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={formData.personal.links.linkedin}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      personal: {
                        ...prev.personal,
                        links: { ...prev.personal.links, linkedin: e.target.value }
                      }
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stack Overflow URL
                </label>
                <input
                  type="url"
                  value={formData.personal.links.stackoverflow}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      personal: {
                        ...prev.personal,
                        links: { ...prev.personal.links, stackoverflow: e.target.value }
                      }
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="https://stackoverflow.com/users/username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Google Scholar URL
                </label>
                <input
                  type="url"
                  value={formData.personal.links.googlescholar}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      personal: {
                        ...prev.personal,
                        links: { ...prev.personal.links, googlescholar: e.target.value }
                      }
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="https://scholar.google.com/citations?user=ID"
                />
              </div>
            </div>
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
                    Company URL
                  </label>
                  <input
                    type="url"
                    value={exp.company_url}
                    onChange={(e) => updateExperience(index, 'company_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="https://techcorp.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Description
                  </label>
                  <input
                    type="text"
                    value={exp.company_description}
                    onChange={(e) => updateExperience(index, 'company_description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="AI-powered business intelligence platform"
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
              + Add Skill Category
            </button>
          </div>
          <div className="space-y-4">
            {formData.skills.map((skillGroup, skillGroupIndex) => (
              <div key={skillGroupIndex} className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    value={skillGroup.category}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        skills: prev.skills.map((sg, i) =>
                          i === skillGroupIndex ? { ...sg, category: e.target.value } : sg
                        )
                      }));
                    }}
                    className="text-lg font-semibold text-gray-900 bg-transparent border-none focus:outline-none"
                    placeholder="Technical Skills"
                  />
                  {formData.skills.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          skills: prev.skills.filter((_, i) => i !== skillGroupIndex)
                        }));
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove Category
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {skillGroup.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateSkills(skillGroupIndex, itemIndex, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                        placeholder="JavaScript, React, Node.js"
                      />
                      {skillGroup.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSkill(skillGroupIndex, itemIndex)}
                          className="text-red-600 hover:text-red-800 px-3"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        skills: prev.skills.map((sg, i) =>
                          i === skillGroupIndex
                            ? { ...sg, items: [...sg.items, ''] }
                            : sg
                        )
                      }));
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add skill
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Awards */}
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
            <h4 className="text-lg font-semibold text-gray-900">Awards</h4>
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
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Add Award
            </button>
          </div>
          {formData.awards.map((award, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h5 className="font-medium text-gray-900">Award {index + 1}</h5>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      awards: prev.awards.filter((_, i) => i !== index)
                    }));
                  }}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Award Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={award.title}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        awards: prev.awards.map((a, i) =>
                          i === index ? { ...a, title: e.target.value } : a
                        )
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="Best Paper Award"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization *
                  </label>
                  <input
                    type="text"
                    required
                    value={award.organization}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        awards: prev.awards.map((a, i) =>
                          i === index ? { ...a, organization: e.target.value } : a
                        )
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="International Conference"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Detail
                  </label>
                  <input
                    type="text"
                    value={award.organization_detail}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        awards: prev.awards.map((a, i) =>
                          i === index ? { ...a, organization_detail: e.target.value } : a
                        )
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="Advanced Techniques in ML"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization URL
                  </label>
                  <input
                    type="url"
                    value={award.organization_url}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        awards: prev.awards.map((a, i) =>
                          i === index ? { ...a, organization_url: e.target.value } : a
                        )
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="https://conference.example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={award.location}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        awards: prev.awards.map((a, i) =>
                          i === index ? { ...a, location: e.target.value } : a
                        )
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="San Francisco, CA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={award.date}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        awards: prev.awards.map((a, i) =>
                          i === index ? { ...a, date: e.target.value } : a
                        )
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Certifications */}
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
            <h4 className="text-lg font-semibold text-gray-900">Certifications</h4>
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
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Add Certification
            </button>
          </div>
          {formData.certifications.map((cert, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h5 className="font-medium text-gray-900">Certification {index + 1}</h5>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      certifications: prev.certifications.filter((_, i) => i !== index)
                    }));
                  }}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Certification Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={cert.title}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        certifications: prev.certifications.map((c, i) =>
                          i === index ? { ...c, title: e.target.value } : c
                        )
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="AWS Certified Solutions Architect"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization *
                  </label>
                  <input
                    type="text"
                    required
                    value={cert.organization}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        certifications: prev.certifications.map((c, i) =>
                          i === index ? { ...c, organization: e.target.value } : c
                        )
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="Amazon Web Services"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    value={cert.url}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        certifications: prev.certifications.map((c, i) =>
                          i === index ? { ...c, url: e.target.value } : c
                        )
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="https://aws.amazon.com/certification"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={cert.date}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        certifications: prev.certifications.map((c, i) =>
                          i === index ? { ...c, date: e.target.value } : c
                        )
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Publications */}
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
            <h4 className="text-lg font-semibold text-gray-900">Publications</h4>
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
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Add Publication
            </button>
          </div>
          {formData.publications.map((pub, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h5 className="font-medium text-gray-900">Publication {index + 1}</h5>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      publications: prev.publications.filter((_, i) => i !== index)
                    }));
                  }}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Authors *
                  </label>
                  <input
                    type="text"
                    required
                    value={pub.authors}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        publications: prev.publications.map((p, i) =>
                          i === index ? { ...p, authors: e.target.value } : p
                        )
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="Doe, J., Smith, A., Johnson, B."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Publication Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={pub.title}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        publications: prev.publications.map((p, i) =>
                          i === index ? { ...p, title: e.target.value } : p
                        )
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="Advanced Machine Learning Techniques"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Venue *
                  </label>
                  <input
                    type="text"
                    required
                    value={pub.venue}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        publications: prev.publications.map((p, i) =>
                          i === index ? { ...p, venue: e.target.value } : p
                        )
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="Journal of Applied Data Science"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={pub.date}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        publications: prev.publications.map((p, i) =>
                          i === index ? { ...p, date: e.target.value } : p
                        )
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    value={pub.url}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        publications: prev.publications.map((p, i) =>
                          i === index ? { ...p, url: e.target.value } : p
                        )
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="https://example.com/publication"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>



        {/* Action Buttons */}
        <div className="pt-6 border-t border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generate Resume
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={handleDownloadResume}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Resume
                </>
              )}
            </button>
          </div>
          
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