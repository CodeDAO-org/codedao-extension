# CodeDAO Git Automation Scripts

Streamlined workflow for managing CodeDAO repository with user approval at every step.

## 🚀 Quick Start

```bash
# Set up aliases (one-time setup)
./scripts/setup-aliases.sh
source ~/.zshrc  # or restart terminal

# Use the workflow
cdpush    # Easy push with confirmations
cdcommit  # Quick commit with templates
```

## 📋 Available Scripts

### 1. `easy-push.sh` - Complete Workflow
**Full automation with user control at every step.**

```bash
./scripts/easy-push.sh
# or use alias: cdpush
```

**Features:**
- ✅ Shows current repository status
- ✅ Smart file selection (dashboard, contracts, docs)
- ✅ Suggests commit messages based on changes
- ✅ Handles pull/merge conflicts automatically
- ✅ Confirms before every major operation
- ✅ Provides GitHub Pages deployment reminders

**Workflow:**
1. Check repository status
2. Choose files to commit (smart/all/custom)
3. Review staged files
4. Enter/confirm commit message
5. Create commit
6. Check for remote updates
7. Pull if needed
8. Push to GitHub with confirmation

### 2. `quick-commit.sh` - Fast Commits
**Pre-defined commit templates for common changes.**

```bash
./scripts/quick-commit.sh
# or use alias: cdcommit
```

**Templates:**
- 🎨 Dashboard update
- ⚙️ Contract update
- 📚 Documentation update
- 🐛 Bug fix
- ✨ New feature
- 🔧 Configuration update
- ✏️ Custom message

### 3. `setup-aliases.sh` - Convenience Setup
**One-time setup for easy commands.**

```bash
./scripts/setup-aliases.sh
```

**Creates aliases:**
- `cdpush` - Easy push workflow
- `cdcommit` - Quick commit templates
- `cdstatus` - Enhanced status + recent commits
- `cdsync` - Check remote status
- `cdlog` - Pretty git log
- `cddiff` - Show changed files

## 🎯 Typical Workflows

### Scenario 1: Update Dashboard
```bash
# Make changes to dashboard files
cdcommit           # Choose "Dashboard update"
cdpush            # Push to GitHub with confirmations
```

### Scenario 2: Complex Changes
```bash
# Make multiple changes
cdpush            # Use smart selection
# Review files → Confirm commit → Confirm push
```

### Scenario 3: Quick Status Check
```bash
cdstatus          # See what's changed
cdsync           # Check remote status
```

## 🔧 Customization

### Modify Smart Selection
Edit `easy-push.sh` line ~65 to change which files are included in smart selection:

```bash
git add dashboard/ contracts/ docs/ *.md *.json *.js *.ts
```

### Add New Commit Templates
Edit `quick-commit.sh` to add new predefined commit types:

```bash
8)
    msg="Your new template message"
    files="specific/files/"
    ;;
```

### Change Default Behavior
- **Auto-push**: Remove push confirmation in `easy-push.sh`
- **Default selection**: Change default from smart to all
- **Commit message format**: Modify suggestion logic

## 🎯 Benefits

### For You:
- ✅ **Faster workflow** - No more manual git commands
- ✅ **Less errors** - Automated conflict handling
- ✅ **Always in control** - Confirm every major action
- ✅ **Smart defaults** - Intelligent file selection and commit messages
- ✅ **Status awareness** - Always know what's happening

### For Collaboration:
- ✅ **Consistent commits** - Standardized messages
- ✅ **Clean history** - Proper file organization
- ✅ **Reduced conflicts** - Automatic pull/merge handling
- ✅ **Documentation** - Clear commit categorization

## 🆘 Troubleshooting

### Script Permission Error
```bash
chmod +x scripts/*.sh
```

### Alias Not Found
```bash
source ~/.zshrc    # or ~/.bashrc
# or restart terminal
```

### Merge Conflicts
The scripts handle most conflicts automatically, but for complex conflicts:
```bash
git status         # See conflicted files
# Edit files manually
git add .
cdpush            # Continue workflow
```

### Authentication Issues
Scripts will fail gracefully and show git error messages. Common solutions:
- Set up SSH keys
- Use GitHub CLI: `gh auth login`
- Check remote URL: `git remote -v`

## 🔗 Integration

### With GitHub Pages
Scripts automatically detect dashboard changes and remind you to:
1. Enable GitHub Pages in repo settings
2. Set source to `main` branch `/docs` folder

### With VS Code
Scripts work seamlessly with VS Code git integration:
- Stage files in VS Code, then run `cdpush`
- Use VS Code merge tools for conflicts
- View commit history in VS Code Source Control

### With GitHub Desktop
Scripts complement GitHub Desktop:
- Use scripts for batch operations
- Use GitHub Desktop for visual diff review
- Both approaches work together

---

**Ready to streamline your git workflow? Start with `./scripts/setup-aliases.sh`!** 🚀
