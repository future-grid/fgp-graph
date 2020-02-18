// Our "trigger" pipeline job definition
pipeline{
  agent {
    label 'default'
  }
  post {
    failure {
      slackSend color: 'bad', message: "Jenkins build for fgp-graph has failed. ${env.VERSION}"
    }
    success {
      slackSend color: 'good', message: "Jenkins build for fgp-graph has succeeded! ${env.VERSION}"
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
          // env.DOCKER_TAG = "${env.VERSION}-${env.GIT_TAG}"
          // env.DOCKER_IMAGE = "futuregrid/futuregrid-web:${env.DOCKER_TAG}"
          // echo "DOCKER_IMAGE=${env.DOCKER_IMAGE}"
          // container('docker'){
          //   sh "docker login -u $DOCKERHUB_USR -p '$DOCKERHUB_PSW'"
          // }
        }
      }
    }
    stage ('build'){
      // when {
      //   expression { ['master'].contains(env.gitlabBranch) || ['origin/master'].contains(env.GIT_BRANCH) }
      // }
      steps {
        container("docker"){
          sh "docker build -t fgp-graph -f Dockerfile.build ."
        }
      }
    }
    // stage ('push'){
    //   when {
    //     expression { ['origin/master'].contains(env.GIT_BRANCH) }
    //   }
    //   steps {
    //     container("docker"){
    //       sh "docker push ${env.DOCKER_IMAGE}"
    //     }
    //   }
    // }
    // stage ('deploy'){
    //   steps {
    //     // withCredentials([usernamePassword(credentialsId: 'beanstalk-credentials', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
    //     //     script {
    //     //         env.encodedPass=URLEncoder.encode(GIT_PASS, "UTF-8")
    //     //     }
    //     //     sh 'rm -rf output-repo'
    //     //     sh 'git clone https://${GIT_USER}:${encodedPass}@${TARGET_REPO} output-repo'
    //     // }
    //     // sh 'rm -rf deployments-repo || true'
    //     withCredentials([usernamePassword(credentialsId: 'beanstalk-credentials', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
    //       script {
    //         env.encodedPass=URLEncoder.encode(GIT_PASS, "UTF-8")
    //       }
    //       sh 'rm -rf deployments-repo'
    //       sh 'git clone https://${GIT_USER}:${encodedPass}@${DEPLOYMENTS_REPO} deployments-repo'
    //     }
    //     dir("deployments-repo"){
          
    //       // git url: env.DEPLOYMENTS_REPO, poll: false, changelog: false, credentialsId: 'beanstalk-credentials'
    //       sh "git config user.name \"Jenkins\""
    //       sh "git config user.email \"noreply@future-grid.com.au\""
          
    //       script {
    //         def chartFile = "environments/future-grid-web-sg/apps/futuregrid-web/Chart.yaml"
    //         chart = readYaml(file: chartFile)
    //         def oldAppVersion = chart['appVersion']
    //         chart['appVersion'] = env.DOCKER_TAG
    //         writeYaml(file: chartFile, data: chart, overwrite: true)

    //         // stage the new dag
    //         sh "git add ${chartFile}"
    //         // add commit comment
    //         sh "git commit -m 'Updating deployment for futuregrid-web, was ${oldAppVersion}, now ${env.DOCKER_TAG}'"
    //         // push it
    //         sh "git push --set-upstream origin master"
    //       }
    //     }
    //   }
    // }
  }
}
