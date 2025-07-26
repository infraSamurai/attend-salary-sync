# 🚀 Vercel Deployment Guide

## Step-by-Step Deployment

### 1. Prerequisites
- GitHub account
- Vercel account (free tier is sufficient)
- Git repository with your code

### 2. Push to GitHub
```bash
# Add all files to git
git add .
git commit -m "Add RBAC authentication system"
git push origin main
```

### 3. Deploy to Vercel

#### Option A: Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com) and login
2. Click **"New Project"**
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

#### Option B: Vercel CLI
```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy from project directory
vercel

# Follow prompts:
# ? Set up and deploy "~/your-project"? Y
# ? Which scope do you want to deploy to? (your-username)
# ? Link to existing project? N
# ? What's your project's name? attend-salary-sync
# ? In which directory is your code located? ./
```

### 4. Configure Environment Variables

In Vercel Dashboard:
1. Go to your project → **Settings** → **Environment Variables**
2. Add these variables:

| Name | Value | Environment |
|------|-------|-------------|
| `JWT_SECRET` | `your-super-secure-random-string-here` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |

**🔒 Important**: Generate a strong JWT_SECRET:
```bash
# Generate a secure random string (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Test Your Deployment

1. **Frontend**: Your Vercel URL (e.g., `https://attend-salary-sync.vercel.app`)
2. **API**: Test endpoints:
   - `https://your-app.vercel.app/api/auth/login`
   - `https://your-app.vercel.app/api/auth/verify`

### 6. Post-Deployment Verification

✅ **Login Screen**: Should NOT show demo accounts in production
✅ **Authentication**: Test login with your user accounts
✅ **Role-based UI**: Verify different user roles see appropriate tabs
✅ **API Endpoints**: All serverless functions working

## 🔐 Production Security

### User Accounts
The system includes these default accounts:
- **admin** / **Adm1n@S3cur3$24** (full access - 14 chars, super secure)
- **manager** / **TeamLeader** (limited admin access - 10 chars, memorable)
- **viewer** / **ReadOnly24** (read-only access - 10 chars, memorable)

### Security Notes
- Demo credentials are hidden in production
- JWT tokens expire in 24 hours
- All passwords are bcrypt hashed
- Role-based permissions protect sensitive operations

## 🔧 Troubleshooting

### API 404 Errors
- Ensure `vercel.json` is in project root
- Check API files are in `/api` directory
- Verify TypeScript files have `.ts` extension

### Build Failures
```bash
# Test build locally first
npm run build

# Check for TypeScript errors
npm run lint
```

### Environment Variables
- JWT_SECRET must be set in production
- Use Vercel Dashboard to manage variables
- Redeploy after adding new environment variables

## 📈 Next Steps

1. **Database**: Replace in-memory storage with Vercel Postgres
2. **Monitoring**: Add error tracking and analytics
3. **Backup**: Implement regular data backups
4. **SSL**: Automatic with Vercel (HTTPS everywhere)

## 🆘 Support

If you encounter issues:
1. Check Vercel Function Logs in dashboard
2. Test API endpoints in browser/Postman
3. Verify environment variables are set correctly