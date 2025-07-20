# CVGen UI

A beautiful, modern frontend for the YAML to PDF CVGen API. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🎯 **Drag & Drop File Upload**: Upload JSON resume files with an intuitive interface
- 📝 **Interactive Form**: Fill out a comprehensive form to create your resume data
- 🔄 **JSON Form Population**: Upload a JSON file to automatically populate the form
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
NEXT_PUBLIC_API_BASE_URL=https://cvgen.fly.dev
```

## Deployment

### Deploy to Vercel

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Set the environment variable:
   - `NEXT_PUBLIC_API_BASE_URL`: `https://cvgen.fly.dev`
4. Deploy!

Alternatively, use the Vercel CLI:

```bash
npx vercel --prod
```

## Usage

### Interactive Form
1. Fill out the comprehensive form with your personal information, experience, education, skills, and more
2. Click "Generate Resume" to create a PDF
3. Or click "Download JSON" to save your data as a JSON file for later use

### JSON File Upload
1. Upload a pre-filled `resume.json` file using the "Upload JSON" button in the form
2. The form will be automatically populated with the JSON content
3. You can edit the populated data before generating the resume
4. Supports standard JSON format with sections for personal info, experience, education, skills, awards, certifications, and publications

### Direct JSON Upload
1. Use the drag & drop area to upload a JSON file directly
2. The PDF will be generated immediately from the uploaded file

## API Integration

This frontend communicates with the Resume Builder API deployed on Fly.dev:

- **Health Check**: `GET /health`
- **Upload JSON**: `POST /upload-json`
- **Generate from Default**: `POST /generate-from-json`
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
│   ├── ResumeForm.tsx    # Interactive resume form with JSON upload
│   └── ResumeGenerator.tsx # Resume generation
└── lib/
    └── api.ts            # API client
```
