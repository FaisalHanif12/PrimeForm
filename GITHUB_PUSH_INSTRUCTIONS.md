# GitHub Push Instructions - AiFunctionality Branch

## Step-by-Step Guide

### Step 1: Initialize Git (If Not Already Done)

```bash
cd "/Users/faisalhanif/MyProfile/Mern Project/PrimeForm"

# Check if git is initialized
git status

# If not initialized, run:
git init
```

### Step 2: Add Remote Repository

```bash
# If you haven't added remote yet
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Or if using SSH
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git

# Verify remote
git remote -v
```

### Step 3: Check Current Branch

```bash
# See current branch
git branch

# If on main/master, create new branch
git checkout -b AiFunctionality

# If branch exists, switch to it
git checkout AiFunctionality
```

### Step 4: Stage All Changes

```bash
# Add all files
git add .

# Or add specific directories
git add PrimeForm/Backend/
git add PrimeForm/Frontend/
git add PrimeForm/*.md
```

### Step 5: Commit Changes

```bash
git commit -m "feat: Complete notification system with Urdu support

- Added in-app notifications for diet/workout plan creation
- Implemented daily push notification reminders (9 AM & 6 PM)
- Added test endpoint for push notification verification
- Verified account-based notification isolation (user-specific)
- Confirmed Urdu transliteration for all dynamic content
- Added comprehensive deployment documentation
- Configured cron jobs for automatic daily reminders
- Added production verification reports"
```

### Step 6: Push to GitHub

```bash
# Push to AiFunctionality branch (first time)
git push -u origin AiFunctionality

# Or if branch already exists on remote
git push origin AiFunctionality
```

### Step 7: Verify Push

1. Go to your GitHub repository
2. Switch to `AiFunctionality` branch
3. Verify all files are present

---

## Complete Command Sequence

```bash
# Navigate to project
cd "/Users/faisalhanif/MyProfile/Mern Project/PrimeForm"

# Check status
git status

# Create/switch to branch
git checkout -b AiFunctionality

# Add all changes
git add .

# Commit
git commit -m "feat: Complete notification system with Urdu support"

# Push
git push -u origin AiFunctionality
```

---

## If You Get Errors

### Error: "not a git repository"
```bash
git init
git remote add origin YOUR_REPO_URL
```

### Error: "branch already exists"
```bash
git checkout AiFunctionality
git pull origin AiFunctionality  # Get latest changes
git add .
git commit -m "Your message"
git push origin AiFunctionality
```

### Error: "authentication failed"
```bash
# Use personal access token instead of password
# Or set up SSH keys
```

---

## Files to Include in Commit

✅ **Include:**
- All source code files
- Configuration files (except .env)
- Documentation files (.md)
- Package.json files

❌ **Exclude (add to .gitignore):**
- `.env` files
- `node_modules/`
- `*.log` files
- `.jwt-token.txt`
- Build artifacts

---

## After Pushing

1. ✅ Verify branch on GitHub
2. ✅ Check all files are present
3. ✅ Review commit message
4. ✅ Create Pull Request (if needed)
5. ✅ Merge to main (when ready)

