# Setting Up Jenkins CI/CD for the Cat-Dog-Vote Project

This guide walks through how Jenkins was set up for the Cat vs Dog Vote application, including the custom Docker image, pipeline configuration, and verification. Follow along to understand or reproduce the setup.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [1. Create a Custom Jenkins Docker Image](#1-create-a-custom-jenkins-docker-image)
4. [2. Add Jenkins to Docker Compose](#2-add-jenkins-to-docker-compose)
5. [3. Create an App-Only Compose File](#3-create-an-app-only-compose-file)
6. [4. Write the Jenkinsfile](#4-write-the-jenkinsfile)
7. [5. Start Jenkins](#5-start-jenkins)
8. [6. Install Required Plugins](#6-install-required-plugins)
9. [7. Create the Pipeline Job](#7-create-the-pipeline-job)
10. [8. Verify the Pipeline](#8-verify-the-pipeline)
11. [Credentials & Access](#credentials--access)
12. [9. Build Triggers](#9-build-triggers)
13. [10. Credentials Management](#10-credentials-management)
14. [11. Manage Jenkins: Tools & Environment](#11-manage-jenkins-tools--environment)
15. [12. Post-Build Actions & Notifications](#12-post-build-actions--notifications)
16. [Troubleshooting](#troubleshooting)

---

## Overview

Jenkins automates the build and deployment of this application:

1. **Checkout** the source code from GitHub
2. **Install** npm dependencies
3. **Build** the frontend (Vite/Vue)
4. **Build** Docker images for frontend, backend, and MongoDB
5. **Deploy** the containers with Docker Compose
6. **Verify** the backend health endpoint

The whole pipeline is defined in a `Jenkinsfile` in the repository root.

---

## Prerequisites

- Docker & Docker Compose installed on the host
- The repository cloned locally (`cat-dog-vote`)
- A GitHub repository for the source (here: `traximuser20/VotingApp`)

---

## 1. Create a Custom Jenkins Docker Image

The default `jenkins/jenkins:lts` image does **not** include `node`, `npm`, or the Docker CLI, so the pipeline can't run. We extend it with those tools.

**File: `Dockerfile.jenkins`**

```dockerfile
FROM jenkins/jenkins:lts

USER root

# Install Docker CLI (needed to build/run the app containers via the mounted docker socket)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        gnupg \
        lsb-release && \
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc && \
    chmod a+r /etc/apt/keyrings/docker.asc && \
    echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends docker-ce-cli docker-compose-plugin && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Node.js 20 and npm (needed for frontend build and tests)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

USER jenkins
```

> **Note:** We install `docker-ce-cli` + `docker-compose-plugin` (v2), which provides the `docker compose` command, **not** the old standalone `docker-compose` v1 binary.

> **Note on npm version:** Do **not** run `npm install -g npm@latest`. Latest npm (v12) requires Node 22+, but we install Node 20. Keep the bundled npm 10.x that ships with Node 20.

---

## 2. Add Jenkins to Docker Compose

**File: `docker-compose.yml`**

Add a `jenkins` service to the stack:

```yaml
  jenkins:
    build:
      context: .
      dockerfile: Dockerfile.jenkins
    container_name: jenkins
    ports:
      - "8080:8080"      # Web UI
      - "50000:50000"    # Agent connections
    volumes:
      - jenkins-data:/var/jenkins_home          # Persist config, plugins, jobs
      - /var/run/docker.sock:/var/run/docker.sock  # Let Jenkins manage Docker
    user: root
    restart: unless-stopped

volumes:
  jenkins-data:
```

Key points:

- **`/var/run/docker.sock` mount** — lets Jenkins build/run Docker containers using the host's Docker daemon.
- **`jenkins-data` volume** — persists all Jenkins configuration, plugins, and jobs across container restarts/recreations.
- **Port 8080** for the UI, **50000** for build agents.

---

## 3. Create an App-Only Compose File

When the pipeline runs `docker compose up`, it would try to recreate the `jenkins` container too, causing a **self-conflict** (Jenkins running inside itself trying to create a container named `jenkins`). To avoid this, the pipeline uses a separate compose file containing only the application services.

**File: `docker-compose.app.yml`**

```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "5002:5001"
    environment:
      PORT: 5001
      MONGODB_URI: mongodb://mongo:27017/cat-dog-vote
      DELETE_SECRET: change-this-to-a-random-string
      CORS_ORIGIN: http://localhost:3000
    depends_on:
      mongo:
        condition: service_started

  mongo:
    build:
      context: .
      dockerfile: Dockerfile.database
    ports:
      - "27019:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

---

## 4. Write the Jenkinsfile

**File: `Jenkinsfile`** (in the repository root)

```groovy
pipeline {
    agent any

    environment {
        DOCKER_COMPOSE_FILE = 'docker-compose.app.yml'
        BACKEND_PORT = '5002'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Docker Build') {
            steps {
                sh "docker compose -f ${DOCKER_COMPOSE_FILE} build"
            }
        }

        stage('Deploy') {
            steps {
                sh "docker compose -f ${DOCKER_COMPOSE_FILE} down"
                sh "docker compose -f ${DOCKER_COMPOSE_FILE} up -d"
            }
        }

        stage('Health Check') {
            steps {
                echo 'Waiting for services to start...'
                sh 'sleep 15'
                script {
                    def healthy = false
                    for (int i = 0; i < 5; i++) {
                        def code = sh(
                            script: "docker compose -f ${DOCKER_COMPOSE_FILE} exec -T backend node -e \"fetch('http://localhost:5001/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))\"",
                            returnStatus: true
                        )
                        if (code == 0) {
                            healthy = true
                            echo 'Backend health check passed'
                            break
                        }
                        echo "Backend not ready, retrying (${i + 1}/5)..."
                        sleep 10
                    }
                    if (!healthy) {
                        error 'Backend health check failed after retries'
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
            sh "docker compose -f ${DOCKER_COMPOSE_FILE} down || true"
        }
    }
}
```

Important design decisions:

- **`docker compose` (v2)** — use the space syntax, not `docker-compose` (v1, not installed).
- **Health check runs inside the backend container** via `docker compose exec` — because `localhost:5002` from inside the Jenkins container doesn't reach the backend (containers are on separate networks). Running the fetch inside the backend's own network works reliably.
- **`checkout scm`** — clones the repo configured in the job (defines where the repo & Jenkinsfile come from).

---

## 5. Start Jenkins

Build the custom image and start the container:

```bash
# Build the custom Jenkins image
docker compose -f docker-compose.yml build jenkins

# Start Jenkins
docker compose -f docker-compose.yml up -d jenkins

# Check logs
docker logs jenkins -f
```

Wait about 15–30 seconds for Jenkins to start.

---

## 6. Install Required Plugins

The default container needs the **Pipeline** and **git** plugins before a Jenkinsfile can run.

Get the initial admin password and the UI:

```bash
# Show the initial admin password (only valid before first setup)
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Open `http://localhost:8080`, complete first-time setup, then install plugins. To install via the API:

```bash
docker exec jenkins sh -c '
CRUMB=$(curl -s -u admin:admin123 -c /tmp/jar.txt "http://localhost:8080/crumbIssuer/api/json" | sed -n "s/.*\"crumb\":\"\([^\"]*\)\".*/\1/p")
curl -s -u admin:admin123 -b /tmp/jar.txt -H "Jenkins-Crumb: $CRUMB" \
  -X POST "http://localhost:8080/pluginManager/install" \
  --data "plugin.workflow-aggregator=true&plugin.git=true&dynamicLoad=false"
'
```

> **CSRF (crumb) tip:** The crumb must come from the same session (same `-c` cookie jar) as the POST, otherwise you get a **403 No valid crumb** error.

After installing `workflow-aggregator` (Pipeline) + `git`, **restart** Jenkins to load the plugins:

```bash
docker compose -f docker-compose.yml restart jenkins
```

Verify plugins loaded:

```bash
curl -s -u admin:admin123 "http://localhost:8080/pluginManager/api/json?depth=1" \
  | grep -oE '"shortName":"(workflow-aggregator|pipeline-model-definition|git)"'
```

---

## 7. Create the Pipeline Job

Create a Pipeline job whose SCM points to the GitHub repo and whose script path is `Jenkinsfile`.

**Job config XML (`job.xml`):**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<flow-definition plugin="workflow-job">
  <description>CI/CD Pipeline for Cat vs Dog Vote application</description>
  <keepDependencies>false</keepDependencies>
  <properties>
    <org.jenkinsci.plugins.workflow.job.properties.DisableConcurrentBuildsJobProperty/>
  </properties>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition" plugin="workflow-cps">
    <scm class="hudson.plugins.git.GitSCM" plugin="git">
      <configVersion>2</configVersion>
      <userRemoteConfigs>
        <hudson.plugins.git.UserRemoteConfig>
          <url>https://github.com/traximuser20/VotingApp.git</url>
        </hudson.plugins.git.UserRemoteConfig>
      </userRemoteConfigs>
      <branches>
        <hudson.plugins.git.BranchSpec>
          <name>*/main</name>
        </hudson.plugins.git.BranchSpec>
      </branches>
      <doGenerateSubmoduleConfigurations>false</doGenerateSubmoduleConfigurations>
      <submoduleCfg class="empty-list"/>
      <extensions/>
    </scm>
    <scriptPath>Jenkinsfile</scriptPath>
    <lightweight>true</lightweight>
  </definition>
  <triggers/>
  <disabled>false</disabled>
</flow-definition>
```

Create it via the REST API:

```bash
docker cp job.xml jenkins:/tmp/job.xml
docker exec jenkins sh -c '
CRUMB=$(curl -s -u admin:admin123 -c /tmp/jar.txt "http://localhost:8080/crumbIssuer/api/json" | sed -n "s/.*\"crumb\":\"\([^\"]*\)\".*/\1/p")
curl -s -u admin:admin123 -b /tmp/jar.txt -H "Jenkins-Crumb: $CRUMB" \
  -X POST "http://localhost:8080/createItem?name=VotingApp-Pipeline" \
  -H "Content-Type: application/xml" \
  --data-binary @/tmp/job.xml
'
```

> The `Jenkinsfile` and `docker-compose.app.yml` must be **committed and pushed** to the remote repo — otherwise `checkout scm` won't find the Jenkinsfile and the job fails with _"Unable to find Jenkinsfile from git ..."_

---

## 8. Verify the Pipeline

Trigger a build and watch the result:

```bash
docker exec jenkins sh -c '
CRUMB=$(curl -s -u admin:admin123 -c /tmp/jar.txt "http://localhost:8080/crumbIssuer/api/json" | sed -n "s/.*\"crumb\":\"\([^\"]*\)\".*/\1/p")
curl -s -u admin:admin123 -b /tmp/jar.txt -H "Jenkins-Crumb: $CRUMB" \
  -X POST "http://localhost:8080/job/VotingApp-Pipeline/build"
'

# Check build result
curl -s -u admin:admin123 "http://localhost:8080/job/VotingApp-Pipeline/lastBuild/api/json"

# Read the console log
curl -s -u admin:admin123 "http://localhost:8080/job/VotingApp-Pipeline/<buildNum>/consoleText"
```

A successful run ends with `Finished: SUCCESS`, builds 3 images, deploys the containers, and passes the health check. Verify the running app:

```bash
curl http://localhost:5002/api/health   # expects {"status":"ok"}
# Frontend at http://localhost:3000
```

---

## Credentials & Access

| Item                  | Value                                                           |
| --------------------- | --------------------------------------------------------------- |
| Jenkins URL           | `http://localhost:8080`                                         |
| Admin user            | `admin`                                                         |
| Admin password        | set during first-time setup (e.g. `admin123`)                   |
| Initial password file | `/var/jenkins_home/secrets/initialAdminPassword` (before setup) |
| Pipeline job          | `VotingApp-Pipeline`                                            |
| Repo                  | `https://github.com/traximuser20/VotingApp` (branch `main`)     |

> **Note:** This project repo previously had MongoDB Atlas credentials committed in `.env` / `atlas-credentials.env`. These were untracked (added to `.gitignore`) for security. Never commit real credentials.

---

## 9. Build Triggers

A build trigger determines _when_ the pipeline runs. This project uses an **instant GitHub webhook trigger** — the pipeline starts the moment a commit lands on `main`, with **no SCM polling lag**. CI stages run first; the CD (Deploy) stage starts immediately after CI succeeds (they are sequential stages in the same run, so there is no idle gap between them).

The trigger is declared in the `Jenkinsfile` (requires the `generic-webhook-trigger` plugin):

```groovy
triggers {
    GenericTrigger(
        token: 'cat-dog-vote',
        jsonPath: '$.ref',
        printContributedVariables: true,
        printPostContent: true,
        causeString: 'Triggered by GitHub webhook push',
        regexpFilterText: '$ref',
        regexpFilterExpression: 'refs/heads/main'
    )
}
```

Declarative `triggers {}` **replaces** any job-level triggers (the old `H/1 * * * *` SCM polling) the first time the pipeline runs after the change.

### How the webhook reaches localhost Jenkins

GitHub can't POST to `localhost:8080`, so a **smee.io relay** bridges the gap. smee gives you a stable public URL (`https://smee.io/<channel>`); the small `smee` client (added as a service in `docker-compose.yml`) forwards every webhook to the **Generic Webhook Trigger** endpoint on Jenkins. We use Generic Webhook Trigger instead of the GitHub plugin's `/github-webhook/` because GitHub's own webhook handler is strict about the exact byte shape of relayed POSTs, while Generic Trigger matches on the JSON body + a token, regardless of headers.

```
push → GitHub webhook → https://smee.io/cat-dog-vote-ci → smee client (localhost)
                                                     ↓
      http://jenkins:8080/generic-webhook-trigger/invoke?token=cat-dog-vote → pipeline starts instantly
```

- The GitHub webhook URL is the smee channel: `https://smee.io/cat-dog-vote-ci`
- The smee client runs persistently next to Jenkins (start with `docker compose -f docker-compose.yml up -d`)
- Override the channel via env vars `SMEE_URL` / `SMEE_TARGET` in `docker-compose.yml` if you pick a different name
- Only pushes to the `main` branch trigger a build (filtered in the trigger config)

### Adding the repo webhook (only needed once, by a repo admin)

```bash
# with gh (admin:repo_hook scope on the repo)
gh api -X POST repos/{owner}/{repo}/hooks \
  -f name=web \
  -f active=true \
  -f config[url]="https://smee.io/cat-dog-vote-ci" \
  -f config[content_type]=json \
  -f events[]=push

# or via the UI: GitHub repo → Settings → Webhooks → Add webhook
#   Payload URL: https://smee.io/cat-dog-vote-ci
#   Content type: application/json
#   Events: Just the push event
```

> **Note:** Old setup used SCM polling (`H/1 * * * *`) so Jenkins checked the repo once a minute — this added up to 60s of delay between push and build start. Polling has been removed in favor of the webhook trigger.

### Legacy triggers (documented for reference)

#### Polling SCM (poll the repo on a schedule)

```xml
<triggers>
  <hudson.triggers.SCMTrigger>
    <spec>H/5 * * * *</spec>
  </hudson.triggers.SCMTrigger>
</triggers>
```

This checks the Git repo every 5 minutes and builds only if there are new commits.

#### Scheduled builds (cron)

Build at a fixed time (e.g. every night at 2:30 AM):

```xml
<triggers>
  <hudson.triggers.TimerTrigger>
    <spec>H 2 * * *</spec>
  </hudson.triggers.TimerTrigger>
</triggers>
```

#### Git webhook (GitHub → Jenkins)

```xml
<triggers>
  <com.cloudbees.jenkins.GitHubPushTrigger>
    <spec/>
  </com.cloudbees.jenkins.GitHubPushTrigger>
</triggers>
```

---

## 10. Credentials Management

Jenkins stores secrets (passwords, SSH keys, API tokens) in a credentials store, so pipelines never hard-code secrets.

### Where credentials live

- **Store:** `Manage Jenkins → Credentials → System → Global credentials (unrestricted)`
- **API:** `http://localhost:8080/credentials/store/system/domain/_/`
- This project currently has **0 credentials configured** — it uses a public HTTPS clone URL and inline API auth, so none are needed yet.

### When you'd need credentials

- Your GitHub repo is **private** (needs a username/password or SSH key)
- Pushing build artifacts back to a registry (Docker Hub, etc.)

### Add credentials via the UI

`Manage Jenkins → Credentials → System → Global credentials → Add Credentials` → choose type (Username/password, SSH key, Secret text) and fill in.

### Reference credentials in the Jenkinsfile

```groovy
stage('Checkout') {
    steps {
        checkout scm
    }
}
// With credentials bound as environment variables:
withCredentials([usernamePassword(credentialsId: 'github-creds',
                                   usernameVariable: 'GH_USER',
                                   passwordVariable: 'GH_PASS')]) {
    sh 'git clone https://$GH_USER:$GH_PASS@github.com/owner/repo.git'
}
```

### Add credentials via the REST API

```bash
docker exec jenkins sh -c '
CRUMB=$(curl -s -u admin:admin123 -c /tmp/jar.txt "http://localhost:8080/crumbIssuer/api/json" | sed -n "s/.*\"crumb\":\"\([^\"]*\)\".*/\1/p")
curl -s -u admin:admin123 -b /tmp/jar.txt -H "Jenkins-Crumb: $CRUMB" \
  -X POST "http://localhost:8080/credentials/store/system/domain/_/createCredentials" \
  --data-urlencode "json={\"\":\"0\",\"credentials\":{\"scope\":\"GLOBAL\",\"id\":\"github-creds\",\"username\":\"myuser\",\"password\":\"mypass\",\"description\":\"GitHub creds\",\"class\":\"com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl\"}}"
'
```

---

## 11. Manage Jenkins: Tools & Environment

Jenkins needs to know where tools (JDK, Git, Node) live. This project's custom image already has them in `PATH`, so no extra tool configuration is required, but it's good to know where these settings live:

### Configure tools

`Manage Jenkins → Tools`:

- **JDK** — for Java builds
- **Git** — the `git` executable (already in PATH here)
- **NodeJS** — requires the **NodeJS plugin** (not installed by default); the Node.js in this image is on PATH directly, so it works without the plugin.

### Global environment variables

Set global key/value pairs:
`Manage Jenkins → System → Global properties → Environment variables`

### Docker agent

`Manage Jenkins → Manage nodes and clouds` — configure a Docker cloud to spin up build agents on demand (more advanced; the built-in node runs jobs here).

---

## 12. Post-Build Actions & Notifications

Jenkins can email or notify on build results so you don't have to watch the dashboard.

### Email notification

1. Install the **"Email Extension"** plugin.
2. Configure SMTP: `Manage Jenkins → System → Extended E-mail Notification` (server, credentials, from address, etc.).
3. Add a step after the pipeline:

```groovy
post {
    success {
        echo 'Pipeline completed successfully!'
    }
    failure {
        echo 'Pipeline failed!'
        sh "docker compose -f ${DOCKER_COMPOSE_FILE} down || true"
        // Send email on failure
        emailext subject: "Build FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                 body: "See ${env.BUILD_URL} for details.",
                 to: 'admin@example.com'
    }
}
```

### Slack / other integrations

Install plugins such as **Slack Notification** and add the corresponding step in the `post` section.

---

## Troubleshooting

### "No such plugin: cloudbees-folder"

The update-center catalog wasn't loaded (often a transient DNS/`UnknownHostException` at startup). Restart the container to re-fetch the catalog:

```bash
docker compose -f docker-compose.yml restart jenkins
```

### `docker-compose: not found`

The container only has `docker compose` (v2). Ensure the Jenkinsfile uses **`docker compose`** (with a space), never `docker-compose`.

### "Unable to find Jenkinsfile from git"

The `Jenkinsfile` isn't in the remote repo. Commit and push it. Note: GitHub's `raw.githubusercontent.com` may cache — verify via `git` protocol instead.

### Port conflicts during Deploy

If another compose stack (`cat-dog-vote`) is running the app on ports 3000/5002/27019, the pipeline's deploy fails. Stop the manually-run app containers so the pipeline owns the deployment:

```bash
docker stop cat-dog-vote-frontend-1 cat-dog-vote-backend-1 cat-dog-vote-mongo-1
```

### `curl: no crumb was included` (403)

The Jenkins CSRF crumb must come from the same cookie session as the request. Reuse a single `-c`/`-b` cookie jar between the crumb fetch and the POST.

### Build agents can't reach the backend at localhost

Containers are on separate networks. Run the health check **inside** the backend container with `docker compose exec -T backend ...` instead of `curl localhost:5002` from the Jenkins container.
