# Check which port is available on the VPS

Run these on the server (SSH or WHM Terminal) to see what Docker and the system are using.

## 1. Ports used by Docker

```bash
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

Shows each container and its host port (e.g. `0.0.0.0:3000->80/tcp` means host port **3000** is taken).

## 2. All listening ports (Docker + other services)

```bash
ss -tlnp | grep -E 'LISTEN|State'
# or
netstat -tlnp 2>/dev/null | grep LISTEN
```

Look at the second column (e.g. `0.0.0.0:3000` = port 3000 in use).

## 3. Pick a free port

Common choices: **3001**, **3002**, **8080**, **8081**. If 3000 is taken by another Docker site, use **3001** (already set in this project).

## 4. Set Verble’s port

- In **docker-compose.vps.yml**, under `services.web.ports`, use e.g. `"3001:80"` (host port 3001 → container 80).
- In **Apache** (`/etc/httpd/conf.d/verble.in.conf`), set `ProxyPass / http://127.0.0.1:3001/` (same port).

Then rebuild/restart:

```bash
cd /path/to/verble
docker compose -f docker-compose.vps.yml up -d
```
