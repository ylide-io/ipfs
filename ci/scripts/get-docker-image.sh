#!/bin/sh

source ./ci/scripts/utils.sh

echo $DOCKER_REGISTRY_URL/$(./ci/scripts/get-docker-image-name.sh)