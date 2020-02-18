// Our "trigger" pipeline job definition
pipeline{
  agent {
    label 'default'
  }
  post {
    failure {
      slackSend color: 'bad', message: "*fgp-graph* build has failed - ${env.VERSION} - ${env.GIT_BRANCH}"
    }
    success {
      script {
        if(['master'].contains(env.GIT_BRANCH) ){
          slackSend color: 'good', message: "*fgp-graph* build+publish has succeeded - ${env.VERSION} - ${env.GIT_BRANCH}"
        }else{
          slackSend color: 'good', message: "*fgp-graph* build has succeeded - ${env.VERSION} - ${env.GIT_BRANCH} - (you still need to merge to master)"
        }
      }
    }
  }

  environment{
    DOCKERHUB = credentials('dockerhub-credentials')
    DEPLOYMENTS_REPO = "future-grid.git.beanstalkapp.com/futuregrid-deploy.git"
  }

  stages{
    stage ('prep'){
      steps {
        script {
          package_json = readJSON(file: 'package.json')
          env.VERSION = package_json.version
          env.GIT_TAG = sh (
            script: 'git rev-parse --short HEAD',
            returnStdout: true
          ).trim()
          echo "VERSION=${env.VERSION}"
          echo "GIT_TAG=${env.GIT_TAG}"
          sh 'printenv'
          container("docker"){
            env.CURRENT_VERSION = sh (
              script: 'docker run --rm --entrypoint sh node:10-alpine -c "npm view @future-grid/fgp-graph version"',
              returnStdout: true
            ).trim()
          }
          echo "CURRENT_VERSION=${env.CURRENT_VERSION}"
          if(env.CURRENT_VERSION == env.VERSION){
            slackSend color: 'bad', message: "*fgp-graph* version ${env.VERSION} already exists - you need to increment the version in your package.json - ${env.GIT_BRANCH}"
            error("fgp-graph: ${env.VERSION} already exists - please increment the version in your package.json - ${env.GIT_BRANCH}")
          }
        }
      }
    }
    stage ('build'){
      steps {
        ansiColor('xterm'){
          container("docker"){
            sh "docker build -t fgp-graph -f Dockerfile.build ."
          }
        }
      }
    }
    stage ('publish'){
      when {
        expression { ['master'].contains(env.GIT_BRANCH) }
      }
      steps {
        container("docker"){
          ansiColor('xterm') {
            sh "docker run --rm -it -e NPM_TOKEN=${env.NPM_TOKEN} --workdir /opt/app npm run-script publish"            
          }
        }
      }
    }
  }
}
