# Branch Protection Rules Configuration

## Overview
This document outlines the branch protection rules for the SaaS Blueprint Generator Platform repository to ensure code quality, prevent direct pushes to main branches, and enforce proper code review processes.

## Branch Structure
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Individual feature branches
- `hotfix/*` - Critical bug fixes
- `release/*` - Release preparation branches

## Protection Rules

### Main Branch Protection
- **Require pull request reviews before merging**: ✅
  - Required number of reviewers: 1
  - Dismiss stale reviews when new commits are pushed: ✅
  - Require review from code owners: ✅
- **Require status checks to pass before merging**: ✅
  - Require branches to be up to date before merging: ✅
  - Status checks: CI/CD pipeline, tests, linting
- **Require conversation resolution before merging**: ✅
- **Require signed commits**: ✅
- **Require linear history**: ✅
- **Include administrators**: ✅
- **Restrict pushes that create files larger than 100MB**: ✅
- **Allow force pushes**: ❌
- **Allow deletions**: ❌

### Develop Branch Protection
- **Require pull request reviews before merging**: ✅
  - Required number of reviewers: 1
  - Dismiss stale reviews when new commits are pushed: ✅
- **Require status checks to pass before merging**: ✅
  - Require branches to be up to date before merging: ✅
  - Status checks: CI/CD pipeline, tests, linting
- **Require conversation resolution before merging**: ✅
- **Allow force pushes**: ❌
- **Allow deletions**: ❌

### Feature Branch Protection
- **Require status checks to pass before merging**: ✅
- **Require branches to be up to date before merging**: ✅
- **Allow force pushes**: ✅ (for feature development)
- **Allow deletions**: ✅ (after merging)

## Setup Instructions

### Option 1: GitHub Web Interface

1. Navigate to your repository: https://github.com/saiyam0211/letsBuildInPublic
2. Go to **Settings** > **Branches**
3. Click **Add rule** for each branch pattern

#### Main Branch Rule:
- Branch name pattern: `main`
- Configure all protection rules as listed above

#### Develop Branch Rule:
- Branch name pattern: `develop`
- Configure protection rules as listed above

#### Feature Branch Rule:
- Branch name pattern: `feature/*`
- Configure basic protection rules

### Option 2: GitHub CLI (Recommended)

```bash
# Install GitHub CLI if not already installed
brew install gh

# Authenticate with GitHub
gh auth login

# Set up branch protection rules
gh api repos/saiyam0211/letsBuildInPublic/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["ci/tests","ci/lint","ci/build"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":true}' \
  --field restrictions=null \
  --field required_conversation_resolution=true \
  --field required_linear_history=true

# Similar setup for develop branch
gh api repos/saiyam0211/letsBuildInPublic/branches/develop/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["ci/tests","ci/lint","ci/build"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null \
  --field required_conversation_resolution=true
```

### Option 3: Using GitHub API with curl

```bash
# Main branch protection
curl -X PUT \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/repos/saiyam0211/letsBuildInPublic/branches/main/protection \
  -d '{
    "required_status_checks": {
      "strict": true,
      "contexts": ["ci/tests", "ci/lint", "ci/build"]
    },
    "enforce_admins": true,
    "required_pull_request_reviews": {
      "required_approving_review_count": 1,
      "dismiss_stale_reviews": true,
      "require_code_owner_reviews": true
    },
    "restrictions": null,
    "required_conversation_resolution": true,
    "required_linear_history": true
  }'
```

## Workflow Integration

These branch protection rules work with the following GitHub Actions workflows:

1. **CI/CD Pipeline** - Must pass before merging
2. **Code Quality Checks** - ESLint, Prettier
3. **Testing** - Unit, Integration, E2E tests
4. **Security Scans** - Dependency and code security

## Best Practices

1. **Feature Development Flow**:
   ```
   feature/xyz → develop → main
   ```

2. **Hotfix Flow**:
   ```
   hotfix/critical-bug → main → develop
   ```

3. **Release Flow**:
   ```
   develop → release/v1.0.0 → main → develop
   ```

## Verification

After setting up protection rules, verify by:

1. Attempting to push directly to `main` (should be blocked)
2. Creating a pull request without required checks (should be blocked)
3. Trying to merge without required reviews (should be blocked)

## Troubleshooting

### Common Issues:
- **Admin bypass**: Ensure "Include administrators" is checked
- **Missing status checks**: Verify GitHub Actions are properly configured
- **Token permissions**: Ensure your GitHub token has repository admin access

### Required Permissions:
- Repository admin access
- Push access to protected branches
- GitHub Actions enabled 