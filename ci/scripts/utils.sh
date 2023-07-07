#!/bin/sh

# Function to check package.json existance:
check_package_json() {
  if [ ! -f package.json ]; then
	echo "package.json file not found in the current working directory. You should run this script from the root of your project."
	exit 1
  fi
}

# Function to extract package.json name and version number, remove @ from the name (if exists):
extract_package_json() {
  NAME=$(cat package.json | grep name | head -1 | awk -F: '{ print $2 }' | sed 's/[", ]//g')
  VERSION=$(cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[", ]//g')
  if [[ $NAME == @* ]]; then
	NAME=$(echo $NAME | cut -c 2-)
  fi
}

check_package_json
extract_package_json