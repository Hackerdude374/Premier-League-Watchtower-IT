pipeline {
  agent any
  options {
    timestamps()
    ansiColor('xterm')
  }

  environment {
    // your Docker Hub namespace
    DOCKERHUB_NS = 'hackerdude374'
    BACKEND_IMG  = "${DOCKERHUB_NS}/backend"
    FRONTEND_IMG = "${DOCKERHUB_NS}/frontend"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Compute Version') {
      steps {
        // get short git sha into env.GIT_SHA (Windows)
        script {
          env.GIT_SHA = bat(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
        }
        echo "GIT_SHA = ${env.GIT_SHA}"
      }
    }

    stage('Backend Tests (Docker Compose)') {
      steps {
        // run docker compose using PowerShell; wait for DB health
        powershell '''
          docker compose build backend db
          docker compose up -d db

          Write-Host "Waiting for DB health..."
          for ($i = 0; $i -lt 30; $i++) {
            $state = docker compose ps --format "{{.Name}} {{.State}}"
            if ($state -match "plwatchtower-db.*healthy") { break }
            Start-Sleep -Seconds 2
          }

          docker compose run --rm backend pytest -q
          docker compose down
        '''
      }
    }

    stage('Build Images') {
      steps {
        powershell '''
          docker build -t "$env:BACKEND_IMG:$env:GIT_SHA"  backend
          docker build -t "$env:FRONTEND_IMG:$env:GIT_SHA" frontend

          docker tag "$env:BACKEND_IMG:$env:GIT_SHA"  "$env:BACKEND_IMG:latest"
          docker tag "$env:FRONTEND_IMG:$env:GIT_SHA" "$env:FRONTEND_IMG:latest"
        '''
      }
    }

    stage('Push Images') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          powershell '''
            $env:DOCKER_PASS | docker login -u $env:DOCKER_USER --password-stdin

            docker push "$env:BACKEND_IMG:$env:GIT_SHA"
            docker push "$env:FRONTEND_IMG:$env:GIT_SHA"
            docker push "$env:BACKEND_IMG:latest"
            docker push "$env:FRONTEND_IMG:latest"

            docker logout
          '''
        }
      }
    }

    stage('Deploy (Terraform)') {
      when { expression { return fileExists('infra/main.tf') } }
      steps {
        withCredentials([usernamePassword(credentialsId: 'aws-keys', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
          powershell '''
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
      powershell 'docker compose down 2>$null; exit 0'
      powershell 'docker system prune -f'
    }
  }
}
