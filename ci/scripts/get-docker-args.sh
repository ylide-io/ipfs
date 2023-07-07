#!/bin/sh

source ./ci/scripts/utils.sh

# Name after slash from $NAME:
NAME_WITHOUT_SCOPE=$(echo $NAME | awk -F/ '{print $2}')

echo " --container-env NEW_RELIC_LICENSE_KEY=$NEW_RELIC_LICENSE_KEY,NEW_RELIC_APP_NAME=$NAME_WITHOUT_SCOPE"