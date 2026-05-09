## MODIFIED Requirements

### Requirement: Push to main SHALL trigger deployment

A GitHub Actions workflow SHALL deploy the application to VPS when code is pushed to main.

#### Scenario: Successful deployment
- **WHEN** a commit is pushed to `main`
- **THEN** the workflow SHALL SSH into the VPS and execute docker compose build and up

#### Scenario: Deploy uses GitHub Secrets
- **WHEN** the workflow runs
- **THEN** it SHALL read SSH credentials from GitHub Secrets (`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`)

#### Scenario: No separate web asset copy needed
- **WHEN** docker compose up completes
- **THEN** web assets SHALL already be in the server container at `dist/public/`
- **AND** the workflow SHALL NOT run `docker cp` to extract web assets
