// API client for Resume Builder backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://cvgen-c-jysq.fly.dev';

export interface ResumeGenerationResponse {
  message: string;
  filename: string;
  download_url: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
  version: string;
  documentation: {
    swagger_ui: string;
    redoc: string;
    openapi_schema: string;
  };
  environment: {
    temp_dir_exists: boolean;
    template_file_exists: boolean;
    resume_json_exists: boolean;
  };
}

export interface ImproveResumeSectionRequest {
  instructions: string;
  section_name: string;
  section_text: string;
}

export interface ImproveResumeSectionResponse {
  improved_section: string;
  message: string;
}

class ResumeBuilderAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async checkHealth(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return response.json();
  }

  async generateFromExistingJson(): Promise<ResumeGenerationResponse> {
    const response = await fetch(`${this.baseUrl}/generate-from-json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Resume generation failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  async uploadJsonAndGenerate(file: File): Promise<ResumeGenerationResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/upload-json`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`JSON upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  async generateFromData(resumeData: Record<string, unknown>): Promise<ResumeGenerationResponse> {
    const response = await fetch(`${this.baseUrl}/generate-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resumeData),
    });

    if (!response.ok) {
      throw new Error(`Resume generation failed: ${response.statusText}`);
    }

    return response.json();
  }

  async improveResumeSection(sectionText: string, sectionName: string = "Professional Summary"): Promise<ImproveResumeSectionResponse> {
    const improveData: ImproveResumeSectionRequest = {
      instructions: "You are a professional recruiter. Improve the writing style of the following resume section to be more professional and concise. Don't provide any other text than the improved resume section.",
      section_name: sectionName,
      section_text: sectionText
    };

    const response = await fetch(`${this.baseUrl}/improve-resume-section`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(improveData),
    });

    if (!response.ok) {
      throw new Error(`Resume section improvement failed: ${response.statusText}`);
    }

    return response.json();
  }

  async downloadPdf(filename: string = 'resume.pdf'): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/download/${filename}`);
    
    if (!response.ok) {
      throw new Error(`PDF download failed: ${response.statusText}`);
    }

    return response.blob();
  }

  getDownloadUrl(filename: string = 'resume.pdf'): string {
    return `${this.baseUrl}/download/${filename}`;
  }
}

export const api = new ResumeBuilderAPI(); 