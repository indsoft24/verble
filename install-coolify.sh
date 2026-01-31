#!/bin/bash

# ============================================================================
# Coolify Installation Script for Ubuntu 22.04 VPS
# This script installs Docker, Docker Compose, and Coolify
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use sudo)"
    exit 1
fi

print_status "Starting Coolify installation on Ubuntu 22.04..."

# ============================================================================
# Step 1: Update System
# ============================================================================
print_status "Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

# ============================================================================
# Step 2: Install Prerequisites
# ============================================================================
print_status "Installing prerequisites..."
apt-get install -y -qq \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    apt-transport-https \
    software-properties-common

# ============================================================================
# Step 3: Install Docker
# ============================================================================
print_status "Installing Docker..."

# Remove old Docker versions if any
apt-get remove -y -qq docker docker-engine docker.io containerd runc 2>/dev/null || true

# Add Docker's official GPG key
print_status "Adding Docker's official GPG key..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Set up Docker repository
print_status "Setting up Docker repository..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
apt-get update -qq
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
print_status "Starting Docker service..."
systemctl start docker
systemctl enable docker

# Add current user to docker group (if not root)
if [ -n "$SUDO_USER" ]; then
    print_status "Adding $SUDO_USER to docker group..."
    usermod -aG docker $SUDO_USER
fi

# Verify Docker installation
if docker --version > /dev/null 2>&1; then
    print_status "Docker installed successfully: $(docker --version)"
else
    print_error "Docker installation failed!"
    exit 1
fi

# ============================================================================
# Step 4: Install Docker Compose (standalone)
# ============================================================================
print_status "Installing Docker Compose..."

# Docker Compose is already installed via docker-compose-plugin, but let's verify
if docker compose version > /dev/null 2>&1; then
    print_status "Docker Compose installed successfully: $(docker compose version)"
else
    print_warning "Docker Compose plugin not found, installing standalone version..."
    
    # Install standalone Docker Compose
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    if docker-compose --version > /dev/null 2>&1; then
        print_status "Docker Compose installed: $(docker-compose --version)"
    else
        print_error "Docker Compose installation failed!"
        exit 1
    fi
fi

# ============================================================================
# Step 5: Configure Firewall (UFW)
# ============================================================================
print_status "Configuring firewall (UFW)..."

# Check if UFW is installed
if ! command -v ufw &> /dev/null; then
    print_status "Installing UFW..."
    apt-get install -y -qq ufw
fi

# Reset UFW to defaults (optional, comment out if you want to preserve existing rules)
# ufw --force reset

# Set default policies
print_status "Setting UFW default policies..."
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (important - don't lock yourself out!)
print_status "Allowing SSH (port 22)..."
ufw allow 22/tcp comment 'SSH'

# Allow HTTP and HTTPS
print_status "Allowing HTTP (port 80) and HTTPS (port 443)..."
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Allow Coolify dashboard port
print_status "Allowing Coolify dashboard (port 8000)..."
ufw allow 8000/tcp comment 'Coolify Dashboard'

# Enable UFW
print_status "Enabling UFW firewall..."
ufw --force enable

# Show firewall status
print_status "Firewall status:"
ufw status numbered

# ============================================================================
# Step 6: Install Coolify
# ============================================================================
print_status "Installing Coolify using official installation script..."

# Create a directory for Coolify if needed
mkdir -p /opt/coolify

# Run official Coolify installation
# This uses the official Coolify installation command
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# ============================================================================
# Step 7: Verify Installation
# ============================================================================
print_status "Verifying installations..."

# Check Docker
if docker --version > /dev/null 2>&1; then
    print_status "✓ Docker is installed and working"
else
    print_error "✗ Docker verification failed"
fi

# Check Docker Compose
if docker compose version > /dev/null 2>&1 || docker-compose --version > /dev/null 2>&1; then
    print_status "✓ Docker Compose is installed and working"
else
    print_error "✗ Docker Compose verification failed"
fi

# Check UFW
if ufw status | grep -q "Status: active"; then
    print_status "✓ UFW firewall is active"
else
    print_warning "⚠ UFW firewall may not be active"
fi

# ============================================================================
# Installation Complete
# ============================================================================
echo ""
print_status "=========================================="
print_status "Installation Complete!"
print_status "=========================================="
echo ""
print_status "Docker: $(docker --version)"
if docker compose version > /dev/null 2>&1; then
    print_status "Docker Compose: $(docker compose version)"
elif docker-compose --version > /dev/null 2>&1; then
    print_status "Docker Compose: $(docker-compose --version)"
fi
echo ""
print_status "Firewall ports opened:"
print_status "  - Port 22 (SSH)"
print_status "  - Port 80 (HTTP)"
print_status "  - Port 443 (HTTPS)"
print_status "  - Port 8000 (Coolify Dashboard)"
echo ""
print_warning "Important Notes:"
print_warning "1. If you added a user to the docker group, they need to log out and back in for changes to take effect"
print_warning "2. Coolify should be accessible at: http://your-server-ip:8000"
print_warning "3. Make sure to configure Coolify according to your needs"
echo ""
print_status "To check Coolify status, run: docker ps"
print_status "To view Coolify logs, run: docker logs coolify"
echo ""
