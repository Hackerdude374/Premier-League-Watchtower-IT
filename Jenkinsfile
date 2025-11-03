pipeline {
  agent any
  options { timestamps(); ansiColor('xterm') }

  environment {
    DOCKERHUB_NS = 'hackerdude374'
    BACKEND_IMG  = "${DOCKERHUB_NS}/backend"
    FRONTEND_IMG = "${DOCKERHUB_NS}/frontend"
    COMPOSE_PROJECT_NAME = 'plwatchtower' // optional, keeps names stable on Windows
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Compute Version') {
      steps {
        script {
          env.GIT_SHA = bat(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
        }
        echo "GIT_SHA = ${env.GIT_SHA}"
      }
    }

    stage('Backend Tests (Docker Compose)') {
      steps {
        powershell '''
          $ErrorActionPreference = "Stop"
          docker compose build backend db
          docker compose up -d db

          Write-Host "Waiting for DB health..."
          for ($i = 0; $i -lt 40; $i++) {
            $ps = docker compose ps --format json | ConvertFrom-Json
            $db = $ps | Where-Object { $_.Service -eq "db" }
            if ($db -and $db.State -match "healthy") { break }
            Start-Sleep -Seconds 2
          }

          docker compose run --rm backend pytest -q
          docker compose down -v
        '''
      }
    }

    stage('Build Images') {
      steps {
        powershell '''
          $ErrorActionPreference = "Stop"
          docker build -t "$Env:BACKEND_IMG:$Env:GIT_SHA"  backend
          docker build -t "$Env:FRONTEND_IMG:$Env:GIT_SHA" frontend

          docker tag "$Env:BACKEND_IMG:$Env:GIT_SHA"  "$Env:BACKEND_IMG:latest"
          docker tag "$Env:FRONTEND_IMG:$Env:GIT_SHA" "$Env:FRONTEND_IMG:latest"
        '''
      }
    }

    stage('Push Images') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          powershell '''
            $ErrorActionPreference = "Stop"
            $Env:DOCKER_PASS | docker login --username $Env:DOCKER_USER --password-stdin
            docker push "$Env:BACKEND_IMG:$Env:GIT_SHA"
            docker push "$Env:FRONTEND_IMG:$Env:GIT_SHA"
            docker push "$Env:BACKEND_IMG:latest"
            docker push "$Env:FRONTEND_IMG:latest"
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
            $ErrorActionPreference = "Stop"
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
      powershell '$ErrorActionPreference="SilentlyContinue"; docker compose down -v 2>$null; docker system prune -f'
    }
  }
}
