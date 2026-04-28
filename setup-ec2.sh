#!/bin/bash
set -e

# Run as root on a fresh Ubuntu 24.04 EC2 instance.
# Usage: bash setup-ec2.sh <your-git-repo-url>
# Example: bash setup-ec2.sh https://github.com/WhopperCat/liminal

REPO_URL="${1:-https://github.com/WhopperCat/liminal}"
APP_DIR="/opt/liminal"

apt-get update -y
apt-get install -y ca-certificates curl git

# Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

systemctl enable --now docker

# Clone and start
git clone "$REPO_URL" "$APP_DIR"
cd "$APP_DIR"
docker compose up -d --build

echo ""
echo "Liminal Axis is running on port 80."
echo "To view logs: docker compose -f $APP_DIR/docker-compose.yml logs -f"
echo "To restart:   docker compose -f $APP_DIR/docker-compose.yml restart"
