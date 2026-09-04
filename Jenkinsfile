pipeline {
    agent any

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
                sh """
                    docker compose -f ${DOCKER_COMPOSE_FILE} down
                    docker compose -f ${DOCKER_COMPOSE_FILE} up -d
                """
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
            sh 'docker compose -f ${DOCKER_COMPOSE_FILE} down || true'
        }
    }
}
