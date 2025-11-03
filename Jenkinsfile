pipeline {
  agent any
  options {
    timestamps()
    ansiColor('xterm')
  }

  environment {
    // change to your Docker Hub namespace
    DOCKERHUB_NS = 'yourdockerhubusername'
    // image names
    BACKEND_IMG  = "${DOCKERHUB_NS}/backend"
    FRONTEND_IMG = "${DOCKERHUB_NS}/frontend"
    // short git sha used for versioning
    GIT_SHA = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
        sh 'git --no-pager log -1 --oneline'
      }
    }

    stage('Backend Tests (Docker Compose)') {
      steps {
        sh '''
          # build only backend & db services for tests
          docker compose build backend db

          # start db in background and wait for health
          docker compose up -d db
          echo "Waiting for DB health..."
          for i in {1..30}; do
            docker compose ps | grep "plwatchtower-db" | grep -q "(healthy)" && break
            sleep 2
          done

          # run pytest inside backend container
          docker compose run --rm backend pytest -q
          docker compose down
        '''
      }
    }

    stage('Build Images') {
      steps {
        sh '''
          # build production images
          docker build -t ${BACKEND_IMG}:${GIT_SHA}  backend
          docker build -t ${FRONTEND_IMG}:${GIT_SHA} frontend

          # also tag "latest" for convenience
          docker tag ${BACKEND_IMG}:${GIT_SHA}  ${BACKEND_IMG}:latest
          docker tag ${FRONTEND_IMG}:${GIT_SHA} ${FRONTEND_IMG}:latest
        '''
      }
    }

    stage('Push Images') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          sh '''
            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
            docker push ${BACKEND_IMG}:${GIT_SHA}
            docker push ${FRONTEND_IMG}:${GIT_SHA}
            docker push ${BACKEND_IMG}:latest
            docker push ${FRONTEND_IMG}:latest
            docker logout
          '''
        }
      }
    }

    stage('Deploy (Terraform)') {
      when {
        expression { return fileExists('infra/main.tf') }
      }
      environment {
        // make images/versions available to Terraform
        TF_VAR_backend_image  = "${BACKEND_IMG}:${GIT_SHA}"
        TF_VAR_frontend_image = "${FRONTEND_IMG}:${GIT_SHA}"
        // If your backend needs the API key injected by ECS/SSM:
        TF_VAR_football_api_key = credentials('football-data-api') // optional secret id in Jenkins
      }
      steps {
        withCredentials([[$class: 'UsernamePasswordMultiBinding',
          credentialsId: 'aws-keys',
          usernameVariable: 'AWS_ACCESS_KEY_ID',
          passwordVariable: 'AWS_SECRET_ACCESS_KEY']]) {
          sh '''
            cd infra
            terraform init -input=false
            terraform plan -out=tfplan -input=false
            terraform apply -input=false -auto-approve tfplan
          '''
        }
      }
    }
  }

  post {
    always {
      sh 'docker compose down || true'
      sh 'docker system prune -f || true'
    }
  }
}
