pipeline {
    agent any

    environment {
        DOCKERHUB_USER  = 'fouedddd'
        IMAGE_NAME      = 'todo-app'
        IMAGE_TAG       = "${BUILD_NUMBER}"
        DOCKERHUB_CREDS = credentials('dockerhub-creds')
    }

    stages {

        stage('Checkout') {
            steps {
                echo '📥 Récupération du code source...'
                checkout scm
            }
        }
        
        stage('Fetch Secrets from Vault') {
    steps {
        echo '🔐 Récupération des secrets depuis Vault...'
        script {
            // Récupérer les secrets DB
            def dbPassword = sh(
                script: "VAULT_ADDR=http://127.0.0.1:8200 VAULT_TOKEN=root vault kv get -field=password secret/todo-app/db",
                returnStdout: true
            ).trim()

            def dbUsername = sh(
                script: "VAULT_ADDR=http://127.0.0.1:8200 VAULT_TOKEN=root vault kv get -field=username secret/todo-app/db",
                returnStdout: true
            ).trim()

            // Stocker comme variables d'environnement
            env.DB_PASSWORD = dbPassword
            env.DB_USERNAME = dbUsername

            echo "✅ Secrets récupérés depuis Vault avec succès !"
        }
    }
}


        stage('SonarQube Analysis') {
            steps {
                echo '🔍 Analyse de code SonarQube...'
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                    sh """
                        docker run --rm \
                            --network host \
                            -v \$(pwd):/usr/src \
                            -e SONAR_TOKEN=${SONAR_TOKEN} \
                            sonarsource/sonar-scanner-cli \
                            -Dsonar.projectKey=todo-app \
                            -Dsonar.sources=/usr/src/app \
                            -Dsonar.host.url=http://192.168.100.133:9000 \
                            -Dsonar.token=${SONAR_TOKEN}
                    """
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo '🐳 Build de l image Docker...'
                sh "docker build -t ${DOCKERHUB_USER}/${IMAGE_NAME}:${IMAGE_TAG} ."
            }
        }

        stage('Trivy Scan') {
            steps {
                echo '🔒 Scan de vulnérabilités Trivy...'
                sh """
                    trivy image \
                        --cache-dir /tmp/trivy-cache \
                        --exit-code 0 \
                        --severity HIGH,CRITICAL \
                        --format table \
                        ${DOCKERHUB_USER}/${IMAGE_NAME}:${IMAGE_TAG}
                """
            }
        }

        stage('Push Docker Hub') {
            steps {
                echo '📤 Push de l image sur Docker Hub...'
                sh """
                    echo ${DOCKERHUB_CREDS_PSW} | docker login -u ${DOCKERHUB_CREDS_USR} --password-stdin
                    docker push ${DOCKERHUB_USER}/${IMAGE_NAME}:${IMAGE_TAG}
                    docker tag ${DOCKERHUB_USER}/${IMAGE_NAME}:${IMAGE_TAG} ${DOCKERHUB_USER}/${IMAGE_NAME}:latest
                    docker push ${DOCKERHUB_USER}/${IMAGE_NAME}:latest
                """
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo '☸️ Déploiement sur Kubernetes...'
                sh """
                    sed -i "s|IMAGE_TAG|${IMAGE_TAG}|g" k8s/deployment.yaml
                    kubectl apply -f k8s/deployment.yaml
                    kubectl apply -f k8s/service.yaml
                    kubectl rollout status deployment/todo-app
                """
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline terminé avec succès !'
        }
        failure {
            echo '❌ Pipeline échoué — vérifiez les logs.'
        }
    }
}
