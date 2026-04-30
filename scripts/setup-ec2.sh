#!/bin/bash
set -euo pipefail

OS=$(grep -w ID /etc/os-release | cut -d= -f2 | tr -d '"')

install_packages() {
  if [[ "$OS" == "amzn" || "$OS" == "rhel" || "$OS" == "centos" ]]; then
    sudo yum install -y "$@"
  else
    sudo apt-get install -y "$@"
  fi
}

if [[ "$OS" == "amzn" || "$OS" == "rhel" || "$OS" == "centos" ]]; then
  sudo yum update -y
else
  sudo apt-get update -y
fi

curl -fsSL https://rpm.nodesource.com/setup_20.x 2>/dev/null | sudo bash - \
  || curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
install_packages nodejs nginx
sudo npm install -g pm2

sudo mkdir -p /var/www/liminal /var/log/liminal
sudo chown -R "$(whoami)":"$(whoami)" /var/www/liminal /var/log/liminal

sudo cp /var/www/liminal/nginx/liminal.conf /etc/nginx/conf.d/liminal.conf
sudo rm -f /etc/nginx/conf.d/default.conf /etc/nginx/sites-enabled/default 2>/dev/null || true
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
pm2 startup | tail -1 | sudo bash -
