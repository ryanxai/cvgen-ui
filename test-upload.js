const fs = require('fs');

// Simulate the parsing logic from ResumeForm.tsx
function parseYamlToFormData(yamlContent) {
  try {
    // Remove YAML front matter markers if present
    const content = yamlContent.replace(/^---\s*\n/, '').replace(/\n---\s*$/, '');
    
    // Simple YAML parser for the resume format
    const lines = content.split('\n');
    const formData = {
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
    };

    let currentSection = '';
    let currentExperience = null;
    let currentEducation = null;
    let currentSkillGroup = null;
    let currentAward = null;
    let currentCertification = null;
    let currentPublication = null;

    for (let i = 0; i < lines.length; i++) {
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
        let degreeName = degree;
        let fieldName = '';
        
        if (degree.includes(' in ')) {
          const parts = degree.split(' in ');
          degreeName = parts[0];
          fieldName = parts.slice(1).join(' in ');
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
      } else if (originalLine.startsWith('    url:') && currentPublication) {
        currentPublication.url = originalLine.substring(7).trim();
      }
    }

    return formData;
  } catch (error) {
    throw new Error('Failed to parse YAML file. Please check the format.');
  }
}

function convertAbbreviatedDateToFormDate(dateString) {
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
}

// Test the parsing
const yamlContent = fs.readFileSync('sample_resume_realistic.yaml', 'utf8');
const result = parseYamlToFormData(yamlContent);

console.log('=== PARSING TEST RESULTS ===');
console.log('Name:', result.personal.name);
console.log('Email:', result.personal.email);
console.log('Phone:', result.personal.phone);
console.log('Location:', result.personal.location);

console.log('\n=== AWARDS ===');
console.log('Awards found:', result.awards.length);
result.awards.forEach((award, index) => {
  console.log(`Award ${index + 1}:`, {
    title: award.title,
    organization: award.organization,
    organization_detail: award.organization_detail,
    organization_url: award.organization_url,
    location: award.location,
    date: award.date
  });
});

console.log('\n=== CERTIFICATIONS ===');
console.log('Certifications found:', result.certifications.length);
result.certifications.forEach((cert, index) => {
  console.log(`Certification ${index + 1}:`, {
    title: cert.title,
    organization: cert.organization,
    url: cert.url,
    date: cert.date
  });
});

console.log('\n=== PUBLICATIONS ===');
console.log('Publications found:', result.publications.length);
result.publications.forEach((pub, index) => {
  console.log(`Publication ${index + 1}:`, {
    authors: pub.authors,
    title: pub.title,
    venue: pub.venue,
    date: pub.date,
    url: pub.url
  });
}); 