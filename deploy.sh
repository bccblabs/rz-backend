#! /usr/bin/bash
set -e
set -u
set -o pipefail

JQ="jq --raw-output --exit-status"

deploy_image () {

    docker push 842535892764.dkr.ecr.us-west-2.amazonaws.com/backend:$CIRCLE_SHA1 | cat
}

make_task_def () {
    task_template='[
        {
            "name": "backend",
            "image": "808855890887.dkr.ecr.us-east-1.amazonaws.com/tunesquad-backend:%s",
            "essential": true,
            "memory": 200,
            "cpu": 4,
            "portMappings": [
                {
                    "containerPort": 8080,
                    "hostPort": 80
                }
            ]
        }
    ]'
    task_def=$(printf "$task_template" $CIRCLE_SHA1 )
}


register_definition() {

    if revision=$(aws ecs register-task-definition --container-definitions "$task_def" --family $family | $JQ '.taskDefinition.taskDefinitionArn'); then
        echo "Revision: $revision"
    else
        echo "Failed to register task definition"
        return 1
    fi
}


deploy_cluster() {
    host_port=80
    family="backend-ecs"

    make_task_def
    register_definition
    if [[ $(aws ecs update-service --cluster backend-test --service backend-ecs-service --task-definition $revision | $JQ '.service.taskDefinition') != $revision ]]; then
        echo "Error updating service."
        return 1
    fi

    # wait for older revisions to disappear
    # not really necessary, but nice for demos
    for attempt in {1..30}; do
        if stale=$(aws ecs describe-services --cluster backend-test --services backend-ecs-service | \
                       $JQ ".services[0].deployments | .[] | select(.taskDefinition != \"$revision\") | .taskDefinition"); then
            echo "Waiting for stale deployments:"
            echo "$stale"
            sleep 5
        else
            echo "Deployed!"
            return 0
        fi
    done
    echo "Service update took too long."
    return 1
}

deploy_image
deploy_cluster
