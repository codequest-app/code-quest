## ADDED Requirements

### Requirement: Push to main SHALL trigger deployment

A GitHub Actions workflow SHALL deploy the application to VPS when code is pushed to main.

#### Scenario: Successful deployment
- **WHEN** a commit is pushed to `main`
- **THEN** the workflow SHALL SSH into the VPS and execute the deploy playbook

#### Scenario: Deploy uses GitHub Secrets
- **WHEN** the workflow runs
- **THEN** it SHALL read SSH credentials from GitHub Secrets (`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`)
