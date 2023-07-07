#!/bin/sh

source ./ci/scripts/utils.sh

gcloud compute instances update-container $DEPLOY_MACHINE_NAME --container-image=$(./ci/scripts/get-docker-image.sh)$(./ci/scripts/get-docker-args.sh)