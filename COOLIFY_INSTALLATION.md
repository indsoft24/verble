# Coolify Installation Guide for Ubuntu 22.04 VPS

## Quick Start

1. **Transfer the script to your VPS:**
   ```bash
   scp install-coolify.sh root@your-server-ip:/root/
   ```

2. **SSH into your VPS:**
   ```bash
   ssh root@your-server-ip
   ```

3. **Run the installation script:**
   ```bash
   chmod +x install-coolify.sh
   sudo ./install-coolify.sh
   ```

## What the Script Does

1. **Updates System** - Updates all system packages
2. **Installs Docker** - Installs Docker Engine using official Docker repository
3. **Installs Docker Compose** - Installs Docker Compose (plugin or standalone)
4. **Configures Firewall** - Sets up UFW firewall with:
   - Port 22 (SSH)
   - Port 80 (HTTP)
   - Port 443 (HTTPS)
   - Port 8000 (Coolify Dashboard)
5. **Installs Coolify** - Runs the official Coolify installation script

## Post-Installation

### Access Coolify Dashboard
- URL: `http://your-server-ip:8000`
- Follow the on-screen setup wizard

### Useful Commands

```bash
# Check Docker status
docker ps

# Check Coolify container
docker ps | grep coolify

# View Coolify logs
docker logs coolify

# Check firewall status
ufw status

# View Docker version
docker --version

# View Docker Compose version
docker compose version
```

### If You Added a User to Docker Group

If the script added a user to the docker group, they need to:
```bash
# Log out and log back in, or run:
newgrp docker
```

## Troubleshooting

### Firewall Issues
If you get locked out of SSH:
```bash
# From another terminal or console, run:
ufw allow 22/tcp
ufw reload
```

### Docker Permission Issues
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in
```

### Check Installation
```bash
# Verify all services
systemctl status docker
ufw status
docker ps
```

## Security Notes

- The script opens port 22 (SSH) - make sure you have strong SSH keys/passwords
- Port 8000 is open for Coolify - consider restricting access to specific IPs if needed:
  ```bash
  ufw allow from YOUR_IP_ADDRESS to any port 8000
  ```
- After installation, review UFW rules:
  ```bash
  ufw status numbered
  ```

## Manual Firewall Rule Management

```bash
# Allow specific IP to access Coolify
ufw allow from 1.2.3.4 to any port 8000

# Remove a rule
ufw delete [rule-number]

# Reload firewall
ufw reload
```
