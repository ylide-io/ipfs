#!/bin/sh

source ./ci/scripts/utils.sh

docker tag $NAME:$VERSION $DOCKER_REGISTRY_URL/$NAME:$VERSION
docker tag $NAME:$VERSION $DOCKER_REGISTRY_URL/$NAME:latest
docker push $DOCKER_REGISTRY_URL/$NAME:$VERSION
docker push $DOCKER_REGISTRY_URL/$NAME:latest