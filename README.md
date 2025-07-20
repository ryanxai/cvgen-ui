# Resume Builder UI

A beautiful, modern frontend for the YAML to PDF Resume Builder API. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🎯 **Drag & Drop File Upload**: Upload YAML resume files with an intuitive interface
- 📝 **Interactive Form**: Fill out a comprehensive form to create your resume data
- 🔄 **YAML Form Population**: Upload a YAML file to automatically populate the form
- ⚡ **Instant Generation**: Generate professional PDFs in seconds
- 🎨 **Beautiful UI**: Modern, responsive design with smooth animations
- 📱 **Mobile Friendly**: Works perfectly on all devices
- 🔒 **Secure**: No data storage, all processing is temporary

## Getting Started

### Prerequisites

- Node.js 18+ 
- NPM or Yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_API_BASE_URL=https://yaml2pdf-resume-builder.fly.dev
```

## Deployment

### Deploy to Vercel

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Set the environment variable:
   - `NEXT_PUBLIC_API_BASE_URL`: `https://yaml2pdf-resume-builder.fly.dev`
4. Deploy!

Alternatively, use the Vercel CLI:

```bash
npx vercel --prod
```

## Usage

### Interactive Form
1. Fill out the comprehensive form with your personal information, experience, education, skills, and more
2. Click "Generate Resume" to create a PDF
3. Or click "Download YAML" to save your data as a YAML file for later use

### YAML File Upload
1. Upload a pre-filled `resume.yaml` file using the "Upload YAML" button in the form
2. The form will be automatically populated with the YAML content
3. You can edit the populated data before generating the resume
4. Supports standard YAML format with sections for personal info, experience, education, skills, awards, certifications, and publications

### Direct YAML Upload
1. Use the drag & drop area to upload a YAML file directly
2. The PDF will be generated immediately from the uploaded file

## API Integration

This frontend communicates with the Resume Builder API deployed on Fly.dev:

- **Health Check**: `GET /health`
- **Upload YAML**: `POST /upload-yaml`
- **Generate from Default**: `POST /generate-from-yaml`
- **Download PDF**: `GET /download/{filename}`

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **API**: Resume Builder API (Fly.dev)

## Project Structure

```
src/
├── app/
│   └── page.tsx          # Main homepage
├── components/
│   ├── FileUpload.tsx    # Drag & drop file upload
│   ├── PdfDownload.tsx   # PDF download component
│   ├── ResumeForm.tsx    # Interactive resume form with YAML upload
│   └── ResumeGenerator.tsx # Resume generation
└── lib/
    └── api.ts            # API client
```
