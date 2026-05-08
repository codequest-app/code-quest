## ADDED Requirements

### Requirement: Server SHALL run in a Docker container

A Dockerfile SHALL produce a production image containing the built server and web static files.

#### Scenario: Docker build succeeds
- **WHEN** `docker compose build` is executed in the deploy directory
- **THEN** a production image SHALL be built with server dist and web dist

#### Scenario: Container starts and serves HTTP
- **WHEN** the server container starts
- **THEN** Express SHALL listen on port 3000
- **AND** WebSocket endpoints `/ws` and `/summoner` SHALL be accessible

### Requirement: Caddy SHALL serve as reverse proxy with automatic SSL

A Caddyfile SHALL configure Caddy to proxy requests to the server container and serve web static files.

#### Scenario: Static files served
- **WHEN** a browser requests `/`
- **THEN** Caddy SHALL serve the Vite build output from the web directory

#### Scenario: API proxied to server
- **WHEN** a request is made to `/ws` or `/summoner`
- **THEN** Caddy SHALL proxy to server:3000 with WebSocket upgrade support

#### Scenario: Automatic HTTPS
- **WHEN** a domain is configured in the Caddyfile
- **THEN** Caddy SHALL automatically obtain and renew Let's Encrypt certificates

### Requirement: Ansible SHALL provision and deploy

An Ansible playbook SHALL handle VPS provisioning (Docker, Caddy install) and app deployment.

#### Scenario: Provision a fresh VPS
- **WHEN** `ansible-playbook playbook-provision.yml` is executed
- **THEN** Docker and Caddy SHALL be installed on the target VPS

#### Scenario: Deploy the application
- **WHEN** `ansible-playbook playbook-deploy.yml` is executed
- **THEN** the latest code SHALL be pulled, built, and started via docker compose
