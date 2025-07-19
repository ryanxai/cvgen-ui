# Resume Builder UI

A beautiful, modern frontend for the YAML to PDF Resume Builder API. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🎯 **Drag & Drop File Upload**: Upload YAML resume files with an intuitive interface
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
│   └── ResumeGenerator.tsx # Resume generation
└── lib/
    └── api.ts            # API client
```
