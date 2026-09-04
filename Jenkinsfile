pipeline {
    agent any

    environment {
        DOCKER_COMPOSE_FILE = 'docker-compose.yml'
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
                    docker-compose -f ${DOCKER_COMPOSE_FILE} build
                """
            }
        }

        stage('Deploy') {
            steps {
                sh """
                    docker-compose -f ${DOCKER_COMPOSE_FILE} down
                    docker-compose -f ${DOCKER_COMPOSE_FILE} up -d
                """
            }
        }

        stage('Health Check') {
            steps {
                sh """
                    sleep 10
                    curl -f http://localhost:${BACKEND_PORT}/api/health || exit 1
                """
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
            sh 'docker-compose -f ${DOCKER_COMPOSE_FILE} down || true'
        }
    }
}
