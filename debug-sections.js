// Debug script for awards, certifications, and publications parsing
const yamlContent = `---
name: Ryan Ghorbandoost

awards:
  - title: Best Paper Award
    organization: International Conference on Machine Learning Applications
    organization_detail: "Advanced Techniques in Time Series Forecasting"
    organization_url: https://www.icmla.example.org
    location: Online
    date: Dec 2022

  - title: Kaggle Competition - Top 5%
    organization: Kaggle
    organization_detail: "Customer Segmentation Challenge"
    organization_url: https://www.kaggle.com/competitions
    location: Online
    date: Mar 2020

certifications:
  - title: AWS Certified Machine Learning - Specialty
    organization: Amazon Web Services
    url: https://aws.amazon.com/certification/certified-machine-learning-specialty/
    date: Sep 2022

  - title: Professional Certificate in Data Science
    organization: Harvard University (edX)
    url: https://www.edx.org/professional-certificate/harvardx-data-science
    date: Jun 2019

publications:
  - authors: Doe, J., Smith, A., Johnson, B.
    title: "Hybrid Approaches to Time Series Forecasting in Financial Markets"
    venue: Journal of Applied Data Science, Vol. 15
    year: 2023
    url: https://example.com/journal/jads/vol15

  - authors: Johnson, B., Doe, J., Williams, C.
    title: "Explainable AI in Healthcare: Methods and Applications"
    venue: International Conference on Health Informatics
    year: 2021
    url: https://example.com/conferences/ichi2021
---`;

const convertAbbreviatedDateToFormDate = (dateString) => {
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

// Parse sections
const parseSections = (yamlContent) => {
  const lines = yamlContent.split('\n');
  const awards = [];
  const certifications = [];
  const publications = [];
  let currentAward = null;
  let currentCertification = null;
  let currentPublication = null;
  let currentSection = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const originalLine = lines[i];
    
    console.log(`Line ${i}: "${originalLine}"`);
    
    if (line.startsWith('awards:')) {
      currentSection = 'awards';
      console.log('Found awards section');
    } else if (line.startsWith('certifications:')) {
      currentSection = 'certifications';
      console.log('Found certifications section');
    } else if (line.startsWith('publications:')) {
      currentSection = 'publications';
      console.log('Found publications section');
    } else if (line.startsWith('  - title:') && currentSection === 'awards') {
      const title = line.substring(10).trim();
      currentAward = {
        title,
        organization: '',
        organization_detail: '',
        organization_url: '',
        location: '',
        date: '',
      };
      awards.push(currentAward);
      console.log('Found award:', currentAward);
    } else if (line.startsWith('    organization:') && currentAward) {
      currentAward.organization = line.substring(16).trim();
      console.log('Found award organization:', currentAward.organization);
    } else if (line.startsWith('    organization_detail:') && currentAward) {
      currentAward.organization_detail = line.substring(23).trim();
      console.log('Found award organization_detail:', currentAward.organization_detail);
    } else if (line.startsWith('    organization_url:') && currentAward) {
      currentAward.organization_url = line.substring(20).trim();
      console.log('Found award organization_url:', currentAward.organization_url);
    } else if (line.startsWith('    location:') && currentAward) {
      currentAward.location = line.substring(12).trim();
      console.log('Found award location:', currentAward.location);
    } else if (line.startsWith('    date:') && currentAward) {
      const dateValue = line.substring(7).trim();
      currentAward.date = convertAbbreviatedDateToFormDate(dateValue);
      console.log('Found award date:', dateValue, '->', currentAward.date);
    } else if (line.startsWith('  - title:') && currentSection === 'certifications') {
      const title = line.substring(10).trim();
      currentCertification = {
        title,
        organization: '',
        url: '',
        date: '',
      };
      certifications.push(currentCertification);
      console.log('Found certification:', currentCertification);
    } else if (line.startsWith('    organization:') && currentCertification) {
      currentCertification.organization = line.substring(16).trim();
      console.log('Found certification organization:', currentCertification.organization);
    } else if (line.startsWith('    url:') && currentCertification) {
      currentCertification.url = line.substring(7).trim();
      console.log('Found certification url:', currentCertification.url);
    } else if (line.startsWith('    date:') && currentCertification) {
      const dateValue = line.substring(7).trim();
      currentCertification.date = convertAbbreviatedDateToFormDate(dateValue);
      console.log('Found certification date:', dateValue, '->', currentCertification.date);
    } else if (line.startsWith('  - authors:') && currentSection === 'publications') {
      const authors = line.substring(11).trim();
      currentPublication = {
        authors,
        title: '',
        venue: '',
        date: '',
        url: '',
      };
      publications.push(currentPublication);
      console.log('Found publication:', currentPublication);
    } else if (line.startsWith('    title:') && currentPublication) {
      currentPublication.title = line.substring(9).trim();
      console.log('Found publication title:', currentPublication.title);
    } else if (line.startsWith('    venue:') && currentPublication) {
      currentPublication.venue = line.substring(9).trim();
      console.log('Found publication venue:', currentPublication.venue);
    } else if (line.startsWith('    year:') && currentPublication) {
      const yearValue = line.substring(8).trim();
      // Convert year to date format (e.g., "2023" -> "2023-01-01")
      currentPublication.date = `${yearValue}-01-01`;
      console.log('Found publication year:', yearValue, '->', currentPublication.date);
    } else if (line.startsWith('    url:') && currentPublication) {
      currentPublication.url = line.substring(7).trim();
      console.log('Found publication url:', currentPublication.url);
    }
  }

  return { awards, certifications, publications };
};

console.log('Testing sections parsing:');
const result = parseSections(yamlContent);
console.log('\nFinal results:');
console.log('Awards:', JSON.stringify(result.awards, null, 2));
console.log('Certifications:', JSON.stringify(result.certifications, null, 2));
console.log('Publications:', JSON.stringify(result.publications, null, 2)); 