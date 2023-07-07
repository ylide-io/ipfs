#!/bin/sh

source ./ci/scripts/utils.sh

if [ "$1" == "--no-cache" ]; then
  # Build the docker image without cache:
  docker build --progress=plain -f ./ci/docker/Dockerfile -t $NAME:$VERSION --no-cache .
else
  # Build the docker image:
  docker build --progress=plain -f ./ci/docker/Dockerfile -t $NAME:$VERSION .
fi