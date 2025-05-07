#!/bin/bash

# variable
IMAGE="ghcr.io/teamgather/app-api:prod"

# image
docker pull $IMAGE

# container
if [ $(docker ps -qa --filter name=^/GATHER_APP_API) ] 
then 
  docker rm -f GATHER_APP_API
fi

docker run \
  --name GATHER_APP_API \
  --restart unless-stopped \
  -e "VIRTUAL_HOST=api.gather.team" \
  -e "VIRTUAL_PORT=5100" \
  -e "LETSENCRYPT_HOST=api.gather.team" \
  -e "LETSENCRYPT_EMAIL=tnitsiri@hotmail.com" \
  -d $IMAGE

# clear unuse images
docker image prune -f
docker system prune -af
