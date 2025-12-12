# Deployment Guide for Ubuntu Vultr Instance

This guide will help you deploy your frontend application to an Ubuntu Vultr instance using Docker.

## Prerequisites

- Ubuntu Vultr instance (Ubuntu 20.04 or later recommended)
- SSH access to your Vultr instance
- Domain name (optional, but recommended)

## Step 1: Connect to Your Vultr Instance

```bash
ssh root@your-server-ip
```

Replace `your-server-ip` with your actual Vultr instance IP address.

## Step 2: Update System Packages

```bash
apt update && apt upgrade -y
```

## Step 3: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Start Docker service
systemctl start docker
systemctl enable docker

# Verify Docker installation
docker --version
```

## Step 4: Install Docker Compose (if not already included)

```bash
# Docker Compose is usually included with Docker, but if not:
apt install docker-compose -y

# Verify installation
docker-compose --version
```

## Step 5: Create Deployment Directory

```bash
mkdir -p /var/www/frontend
cd /var/www/frontend
```

## Step 6: Transfer Your Project Files

You have two options:

### Option A: Using Git (Recommended)

```bash
# Install Git if not installed
apt install git -y

# Clone your repository
git clone <your-repository-url> .

# Make sure you're in the project root
```

### Option B: Using SCP (from your local machine)

From your local machine, run:
```bash
scp -r . root@your-server-ip:/var/www/frontend/
```

## Step 7: Build and Run with Docker

### Using Docker Compose (Recommended)

```bash
cd /var/www/frontend

# Build and start the container
docker-compose up -d

# Check if container is running
docker-compose ps

# View logs
docker-compose logs -f
```

### Using Docker directly

```bash
cd /var/www/frontend

# Build the image
docker build -t frontend-app .

# Run the container
docker run -d -p 80:80 --name frontend-app --restart unless-stopped frontend-app

# Check if container is running
docker ps

# View logs
docker logs -f frontend-app
```

## Step 8: Configure Firewall

```bash
# Install UFW if not installed
apt install ufw -y

# Allow HTTP traffic
ufw allow 80/tcp

# Allow HTTPS traffic (if using SSL)
ufw allow 443/tcp

# Allow SSH (important!)
ufw allow 22/tcp

# Enable firewall
ufw enable

# Check firewall status
ufw status
```

## Step 9: Verify Deployment

Open your browser and navigate to:
- `http://your-server-ip`

You should see your application running!

## Step 10: Set Up Domain (Optional)

If you have a domain name:

1. Point your domain's A record to your Vultr instance IP
2. Wait for DNS propagation (can take up to 48 hours, usually much faster)

## Step 11: Set Up SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Stop the Docker container temporarily
docker-compose down
# OR
docker stop frontend-app

# Install Nginx on host (temporary, for SSL)
apt install nginx -y

# Obtain SSL certificate
certbot certonly --standalone -d your-domain.com

# After obtaining certificate, stop nginx
systemctl stop nginx

# Start your Docker container again
docker-compose up -d
# OR
docker start frontend-app
```

For SSL with Docker, you'll need to modify the Dockerfile to include SSL configuration or use a reverse proxy.

## Useful Commands

### View container logs
```bash
docker-compose logs -f
# OR
docker logs -f frontend-app
```

### Restart the container
```bash
docker-compose restart
# OR
docker restart frontend-app
```

### Stop the container
```bash
docker-compose down
# OR
docker stop frontend-app
```

### Update application (after code changes)
```bash
cd /var/www/frontend

# If using Git, pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build
# OR
docker stop frontend-app
docker rm frontend-app
docker build -t frontend-app .
docker run -d -p 80:80 --name frontend-app --restart unless-stopped frontend-app
```

### Remove everything (cleanup)
```bash
docker-compose down
docker system prune -a
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker logs frontend-app

# Check if port 80 is already in use
netstat -tulpn | grep :80
```

### Permission issues
```bash
# Add your user to docker group (if not using root)
usermod -aG docker $USER
```

### Check container status
```bash
docker ps -a
```

### Access container shell
```bash
docker exec -it frontend-app sh
```

## Performance Optimization

For production, consider:

1. **Use a reverse proxy** (nginx or Traefik) for SSL termination
2. **Set up monitoring** (Portainer, Prometheus, etc.)
3. **Enable Docker resource limits** in docker-compose.yml
4. **Set up automatic backups**
5. **Configure log rotation**

## Security Recommendations

1. **Don't run as root**: Create a non-root user for Docker operations
2. **Keep system updated**: Regularly run `apt update && apt upgrade`
3. **Use SSH keys**: Disable password authentication for SSH
4. **Enable fail2ban**: Protect against brute force attacks
5. **Set up firewall rules**: Only open necessary ports
6. **Use SSL/HTTPS**: Always use HTTPS in production

## Next Steps

- Configure your backend API endpoints in your application
- Set up CI/CD pipeline for automatic deployments
- Configure monitoring and logging
- Set up automated backups

