#!/bin/bash

# Branch Protection Setup Script for SaaS Blueprint Generator Platform
# This script sets up branch protection rules using GitHub CLI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Repository details
REPO_OWNER="saiyam0211"
REPO_NAME="letsBuildInPublic"

echo -e "${GREEN}🛡️  Setting up branch protection rules for ${REPO_OWNER}/${REPO_NAME}${NC}"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed. Please install it first:${NC}"
    echo -e "${YELLOW}   brew install gh${NC}"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}🔐 Please authenticate with GitHub CLI:${NC}"
    gh auth login
fi

echo -e "${YELLOW}📋 Setting up branch protection rules...${NC}"

# Function to create develop branch if it doesn't exist
create_develop_branch() {
    echo -e "${YELLOW}🌱 Checking if develop branch exists...${NC}"
    
    if ! git show-ref --verify --quiet refs/heads/develop; then
        echo -e "${YELLOW}   Creating develop branch from main...${NC}"
        git checkout -b develop
        git push -u origin develop
        git checkout main
    else
        echo -e "${GREEN}   ✅ Develop branch already exists${NC}"
    fi
}

# Function to set up main branch protection
setup_main_protection() {
    echo -e "${YELLOW}🔒 Setting up main branch protection...${NC}"
    
    # Create temporary JSON file for the API call
    cat > /tmp/main_protection.json << 'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": []
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "required_conversation_resolution": true,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
    
    gh api repos/${REPO_OWNER}/${REPO_NAME}/branches/main/protection \
        --method PUT \
        --input /tmp/main_protection.json \
        > /dev/null
        
    # Clean up
    rm /tmp/main_protection.json
        
    echo -e "${GREEN}   ✅ Main branch protection configured${NC}"
}

# Function to set up develop branch protection
setup_develop_protection() {
    echo -e "${YELLOW}🔒 Setting up develop branch protection...${NC}"
    
    # Create temporary JSON file for the API call
    cat > /tmp/develop_protection.json << 'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": []
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "required_conversation_resolution": true,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
    
    gh api repos/${REPO_OWNER}/${REPO_NAME}/branches/develop/protection \
        --method PUT \
        --input /tmp/develop_protection.json \
        > /dev/null
        
    # Clean up
    rm /tmp/develop_protection.json
        
    echo -e "${GREEN}   ✅ Develop branch protection configured${NC}"
}

# Function to create CODEOWNERS file
create_codeowners() {
    echo -e "${YELLOW}👥 Setting up CODEOWNERS file...${NC}"
    
    if [ ! -f ".github/CODEOWNERS" ]; then
        cat > .github/CODEOWNERS << EOF
# Global owners
* @saiyam0211

# Frontend code
/frontend/ @saiyam0211
*.tsx @saiyam0211
*.ts @saiyam0211

# Backend code
/backend/ @saiyam0211
*.js @saiyam0211

# Infrastructure and CI/CD
/.github/ @saiyam0211
/docker/ @saiyam0211
*.yml @saiyam0211
*.yaml @saiyam0211

# Documentation
*.md @saiyam0211
/docs/ @saiyam0211

# Configuration files
package.json @saiyam0211
package-lock.json @saiyam0211
*.config.js @saiyam0211
EOF
        echo -e "${GREEN}   ✅ CODEOWNERS file created${NC}"
    else
        echo -e "${GREEN}   ✅ CODEOWNERS file already exists${NC}"
    fi
}

# Function to create pull request template
create_pr_template() {
    echo -e "${YELLOW}📝 Setting up pull request template...${NC}"
    
    if [ ! -f ".github/pull_request_template.md" ]; then
        cat > .github/pull_request_template.md << 'EOF'
## 📋 Description
Brief description of what this PR does.

## 🔗 Related Issue
Fixes #(issue number)

## 🧪 Type of Change
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🔧 Configuration change
- [ ] 🧹 Code cleanup/refactoring

## ✅ How Has This Been Tested?
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Manual testing

## 📸 Screenshots (if applicable)
<!-- Add screenshots here -->

## ✅ Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published in downstream modules

## 🔍 Additional Notes
<!-- Any additional information, deployment notes, etc. -->
EOF
        echo -e "${GREEN}   ✅ Pull request template created${NC}"
    else
        echo -e "${GREEN}   ✅ Pull request template already exists${NC}"
    fi
}

# Function to verify branch protection
verify_protection() {
    echo -e "${YELLOW}🔍 Verifying branch protection rules...${NC}"
    
    # Check main branch protection
    if gh api repos/${REPO_OWNER}/${REPO_NAME}/branches/main/protection > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Main branch protection verified${NC}"
    else
        echo -e "${RED}   ❌ Main branch protection not found${NC}"
    fi
    
    # Check develop branch protection
    if gh api repos/${REPO_OWNER}/${REPO_NAME}/branches/develop/protection > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Develop branch protection verified${NC}"
    else
        echo -e "${RED}   ❌ Develop branch protection not found${NC}"
    fi
}

# Function to update protection with status checks later
update_status_checks() {
    echo -e "${YELLOW}📝 Note: Status checks will be automatically added when CI/CD workflows are set up${NC}"
    echo -e "${YELLOW}   The following status checks will be required:${NC}"
    echo -e "   - Code Quality & Linting"
    echo -e "   - Run Tests" 
    echo -e "   - Build Application"
    echo -e "   - Security Scan"
    echo -e "   - Type Check"
}

# Main execution
main() {
    echo -e "${GREEN}🚀 Starting branch protection setup...${NC}"
    
    # Create necessary files and branches
    create_codeowners
    create_pr_template
    create_develop_branch
    
    # Set up branch protection rules
    setup_main_protection
    setup_develop_protection
    
    # Verify setup
    verify_protection
    
    # Information about status checks
    update_status_checks
    
    echo -e "${GREEN}🎉 Branch protection setup completed successfully!${NC}"
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo -e "   1. Commit and push the new .github files"
    echo -e "   2. Set up your GitHub Actions secrets if needed"
    echo -e "   3. Test the protection rules by creating a test PR"
    echo -e ""
    echo -e "${YELLOW}🔗 View your branch protection rules at:${NC}"
    echo -e "   https://github.com/${REPO_OWNER}/${REPO_NAME}/settings/branches"
}

# Run the script
main "$@" 