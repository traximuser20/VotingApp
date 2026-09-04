pipeline {
    agent any

    triggers {
        GenericTrigger(
            token: 'cat-dog-vote',
            causeString: 'Triggered by GitHub webhook push',
            regexpFilterText: '$ref',
            regexpFilterExpression: 'refs/heads/main',
            genericVariables: [
                [$class: 'GenericVariable', key: 'ref', value: '$.ref']
            ]
        )
    }

    environment {
        DOCKER_COMPOSE_FILE = 'docker-compose.app.yml'
        FRONTEND_PORT = '3000'
        BACKEND_PORT = '5002'
        MONGO_PORT = '27019'
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
                sh """
                    docker compose -f ${DOCKER_COMPOSE_FILE} build
                """
            }
        }

        stage('Deploy') {
            steps {
                echo 'Stopping old stack and starting new stack (waiting for healthy)...'
                sh """
                    docker compose -f ${DOCKER_COMPOSE_FILE} down
                    docker compose -f ${DOCKER_COMPOSE_FILE} up -d --wait --wait-timeout 300
                """
            }
        }

        stage('Health Check') {
            steps {
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
                        sleep 3
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
        }
    }
}