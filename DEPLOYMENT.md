# Deployment Guide

This guide covers how to set up CI/CD for automatic Vercel deployment of your resume builder application.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Vercel CLI** (optional for local deployment): `npm i -g vercel`

## Setup Options

### Option 1: GitHub Actions (Recommended)

#### Step 1: Get Vercel Tokens and IDs

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to Settings → Tokens
3. Create a new token with appropriate permissions
4. Go to your project settings to get:
   - **Project ID**: Found in project settings
   - **Org ID**: Found in account settings

#### Step 2: Add GitHub Secrets

In your GitHub repository, go to Settings → Secrets and variables → Actions, and add:

- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

#### Step 3: Push to Trigger Deployment

The CI/CD pipeline will automatically:
- Run on every push to `main`/`master` branch
- Run on every pull request
- Execute tests and linting
- Deploy preview builds for PRs
- Deploy to production for main branch pushes

### Option 2: Vercel Dashboard Integration

1. Connect your GitHub repository to Vercel
2. Vercel will automatically deploy on every push
3. Configure build settings in Vercel dashboard

### Option 3: Local Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy using the script
npm run deploy

# Or deploy directly
npm run deploy:vercel
```

## Workflow Details

### GitHub Actions Workflow

The `.github/workflows/ci-cd.yml` file includes:

1. **Test Job**: Runs linting, building, and testing
2. **Preview Deployment**: Creates preview URLs for pull requests
3. **Production Deployment**: Deploys to production on main branch pushes

### Environment Variables

Make sure your environment variables are configured in Vercel:
- `NEXT_PUBLIC_API_BASE_URL`: Your API endpoint

## Troubleshooting

### Common Issues

1. **Build Failures**: Check the build logs in GitHub Actions
2. **Missing Secrets**: Ensure all Vercel secrets are added to GitHub
3. **Permission Issues**: Verify Vercel token has correct permissions

### Manual Deployment

If automatic deployment fails:

```bash
# Build locally
npm run build

# Deploy manually
vercel --prod
```

## Best Practices

1. **Branch Protection**: Enable branch protection on main/master
2. **Required Reviews**: Require PR reviews before merging
3. **Environment Separation**: Use different environments for staging/production
4. **Monitoring**: Set up monitoring for your deployed application

## Security Notes

- Never commit Vercel tokens to your repository
- Use environment variables for sensitive data
- Regularly rotate your Vercel tokens
- Review deployment permissions regularly 