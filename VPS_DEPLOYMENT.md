# Verble – VPS deployment

## Best way: **Git** (recommended)

Use **Git on the VPS** (clone + pull) instead of uploading files over SSH.

| | Git (clone/pull) | Direct upload (SSH/scp/rsync) |
|---|------------------|-------------------------------|
| **Updates** | `git pull` then rebuild; clean and repeatable | Re-upload everything; easy to miss files or overwrite `.env` |
| **Rollbacks** | `git checkout <tag>` and rebuild | Manual; no version history on server |
| **Consistency** | Same code as repo; one source of truth | Risk of server and repo drifting apart |
| **Secrets** | `.env` stays only on server; never in repo | Must be careful not to overwrite `.env` when uploading |
| **Automation** | Easy to add a small deploy script (pull → build → up) | Harder to automate safely |

**Recommendation:** Deploy and update via **Git**. Use direct upload only for one-off fixes or if Git is not an option.

---

## Option A: Git-based deployment (recommended)

### First-time setup on the VPS

1. **Install Docker (and Docker Compose)** if not already installed.

2. **Clone the repo** (use HTTPS or SSH, depending on how you access GitHub):

   ```bash
   cd /var/www   # or wherever you host apps
   git clone https://github.com/indsoft24/verble_official.git verble
   cd verble
   ```

3. **Create and configure `.env`** (never commit this file):

   If **Node is installed** on the VPS:
   ```bash
   cp coaching-platform-backend/.env.example coaching-platform-backend/.env
   node coaching-platform-backend/scripts/generate-secrets.js
   ```

   If **Node is not installed** (Docker-only host), use the shell script instead:
   ```bash
   cp coaching-platform-backend/.env.example coaching-platform-backend/.env
   sh coaching-platform-backend/scripts/generate-secrets.sh
   ```

   Then edit:
   ```bash
   nano coaching-platform-backend/.env   # set BASE_URL, FRONTEND_URL, CORS_ORIGIN, email, etc.
   ```

4. **Build and start the stack:**

   ```bash
   ./scripts/ready-to-deploy.sh
   ```

   Or manually:

   ```bash
   docker compose -f docker-compose.vps.yml build
   docker compose -f docker-compose.vps.yml up -d
   ```

5. **Point your reverse proxy** (Nginx/Caddy) at `http://127.0.0.1:3000` for the Verble domain.

### Updating the app (after you push to GitHub)

On the VPS:

```bash
cd /var/www/verble
git pull
./scripts/ready-to-deploy.sh
```

Or, if you don’t need to regenerate secrets:

```bash
git pull
docker compose -f docker-compose.vps.yml build
docker compose -f docker-compose.vps.yml up -d
```

Your `.env` is untouched; only code and images are updated.

---

## Option B: Direct upload via SSH

Use this only if you can’t use Git on the VPS.

1. **On your machine**, from the project root:

   ```bash
   rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'coaching-platform-backend/.env' \
     ./ user@YOUR_VPS_IP:/var/www/verble/
   ```

   - `--exclude 'node_modules'` and `--exclude '.git'` avoid uploading huge/unnecessary folders.
   - `--exclude 'coaching-platform-backend/.env'` prevents overwriting the server’s `.env`.

2. **On the VPS**, create `.env` once if it doesn’t exist:

   ```bash
   cd /var/www/verble
   cp coaching-platform-backend/.env.example coaching-platform-backend/.env
   node coaching-platform-backend/scripts/generate-secrets.js
   nano coaching-platform-backend/.env
   ```

3. **Build and start:**

   ```bash
   docker compose -f docker-compose.vps.yml build
   docker compose -f docker-compose.vps.yml up -d
   ```

**Downsides:** Every update requires running rsync again and rebuilding; no Git history on the server; easier to accidentally overwrite `.env` if you don’t exclude it.

---

## Summary

- **Best approach:** Deploy and update via **Git** (clone once, then `git pull` + rebuild/restart).
- **Alternative:** **Direct upload with rsync** over SSH, always excluding `node_modules`, `.git`, and `coaching-platform-backend/.env`, then run the same Docker commands on the VPS.
