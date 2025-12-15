# Business-OS Development Guide

## Overview

This project uses separate environments for **production** and **development** to ensure safe feature development without affecting production data.

---

## Branch Strategy

### `main` Branch
- **Purpose**: Production-ready code
- **Protection**: Never push directly to main
- **Database**: Uses `server/data/data.production.json`
- **Environment**: Production settings from `server/.env.production`

### `development` Branch
- **Purpose**: Active development and testing
- **Database**: Uses `server/data/data.development.json`
- **Environment**: Development settings from `server/.env.development`

### Feature Branches (Optional)
- **Format**: `feature/feature-name`
- **Workflow**: Branch from `development` → work → merge back to `development`

---

## Environment Files

### Server Environment (`.env.production` / `.env.development`)
```bash
NODE_ENV=development              # or production
PORT=3000
DATA_FILE=./data/data.development.json   # or data.production.json
UPLOADS_DIR=./uploads-dev         # or ./uploads
ARCHIVES_DIR=./archives-dev/payslips     # or ./archives/payslips
BACKUP_ENABLED=false              # true for production
```

### Client Environment (`.env.production` / `.env.development`)
```bash
VITE_API_URL=http://localhost:3000/api
```

> [!IMPORTANT]
> **Never commit `.env` files!** They're protected by `.gitignore`. Use `.env.example` templates for reference.

---

## Running the Application

### Development Mode (Default)
```bash
# Start server (uses development database)
cd server
npm run dev

# Start client (in another terminal)
cd client
npm run dev
```

This uses:
- Database: `server/data/data.development.json`
- Uploads: `server/uploads-dev/`
- Archives: `server/archives-dev/`

### Production Mode (Testing Production Config)
```bash
# Start server with production settings
cd server
npm run dev:prod

# Client runs the same way
cd client
npm run dev
```

This uses:
- Database: `server/data/data.production.json`
- Uploads: `server/uploads/`
- Archives: `server/archives/`

### Production Start (Deployment)
```bash
cd server
npm start
```

---

## Development Workflow

### 1. Starting New Work
```bash
# Make sure you're on development branch
git checkout development

# Pull latest changes
git pull origin development

# Start dev servers
cd server && npm run dev
# In another terminal: cd client && npm run dev
```

### 2. Making Changes
- Edit code freely on the `development` branch
- Test changes at `http://localhost:5173`
- All data changes affect only `data.development.json`
- Your production data remains safe in `data.production.json`

### 3. Testing Your Changes
```bash
# Run in development mode
npm run dev

# Add test data (employees, inventory, etc.)
# Make test payroll runs
# Ensure everything works as expected
```

### 4. Committing Changes
```bash
git add .
git commit -m "feat: add new feature"
git push origin development
```

### 5. Merging to Production
```bash
# Switch to main branch
git checkout main

# Merge from development
git merge development

# Push to main
git push origin main
```

> [!WARNING]
> **Before merging to main:**
> - Test thoroughly on `development` branch
> - Ensure no breaking changes
> - Backup production data if needed
> - Consider testing with production data locally using `npm run dev:prod`

---

## Database Management

### Separate Databases

| Environment | Database File | Branch | Purpose |
|------------|--------------|--------|---------|
| **Production** | `data.production.json` | `main` | Real business data |
| **Development** | `data.development.json` | `development` | Test data |

### Resetting Development Database
If you want to start fresh or sync with production:

```bash
# Copy production data to development (BE CAREFUL!)
cp server/data/data.production.json server/data/data.development.json
```

### Backing Up Production Data
```bash
# Manual backup
cp server/data/data.production.json server/data/data.production.backup.$(date +%Y%m%d).json
```

Auto-backups are created daily in `server/backups/` (when `BACKUP_ENABLED=true`).

---

## Troubleshooting

### Server shows wrong environment
Check that `NODE_ENV` is set correctly:
```bash
# Should show environment info on startup:
# 📍 Environment: development
# 📂 Data File: /path/to/data.development.json
```

### Changes appear in production
- Verify you're on the `development` branch: `git branch --show-current`
- Check server startup logs to confirm it's using `data.development.json`
- Ensure you ran `npm run dev` (not `npm run dev:prod`)

### Environment files not loading
- Ensure `.env.development` and `.env.production` exist in `server/` directory
- Check for syntax errors in `.env` files
- Restart the server after changing `.env` files

### Lost development data
- Check `server/backups/` for automatic backups
- Restore from `data.production.json` if needed

---

## Best Practices

1. **Always work on `development` branch** for new features
2. **Never edit production data directly** - use the development database for testing
3. **Commit often** to track your changes
4. **Test thoroughly** before merging to `main`
5. **Keep `.env` files private** - never commit them
6. **Backup before major changes** to production
7. **Use meaningful commit messages** (e.g., `feat:`, `fix:`, `docs:`)

---

## Quick Reference

### Check Current Branch
```bash
git branch --show-current
```

### Switch Branches
```bash
git checkout development  # For development work
git checkout main        # For production
```

### View Git Status
```bash
git status
```

### Start Development Servers
```bash
# Terminal 1 - Server
cd server && npm run dev

# Terminal 2 - Client
cd client && npm run dev
```

---

## Need Help?

- Check server startup logs for environment configuration
- Review `.env.example` files for required variables
- Ensure both `data.production.json` and `data.development.json` exist
- Verify you're on the correct git branch before starting work
