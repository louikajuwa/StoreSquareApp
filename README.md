# StoreSquareApp

A Dockerized Laravel 11 + React 18 e-commerce store with Square Sandbox payments and live Socket.io admin updates.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/) (v2, the `docker compose` plugin)

## Run

```bash
docker compose up -d --build
```

Then run first-time setup inside the `php` container (containers start with `php-fpm` and `node server.js` — nothing is migrated or built automatically):

```bash
# composer.lock ships stale (square/square missing), so update rather than install:
docker compose exec php composer update square/square --with-all-dependencies

# the shipped node_modules is incomplete — a full install is required:
docker compose exec php npm install

# build Vite assets, or pages return HTTP 500 ("Vite manifest not found"):
docker compose exec php npm run build

# run migrations + seed the database:
docker compose exec php php artisan migrate --seed --force

# clear stale caches and fix storage permissions:
docker compose exec php php artisan optimize:clear
docker compose exec php chmod -R 775 storage bootstrap/cache
docker compose exec php chown -R www-data:www-data storage bootstrap/cache
```

## Services

The Compose project name is `storesquareapp` (the folder name), so containers are named `storesquareapp-<service>-1`.

| Service | Image / Build | Purpose | Port (host:container) | URL |
|---------|---------------|---------|-----------------------|-----|
| `nginx` | `nginx:1.25-alpine` | Web server / reverse proxy | `8001:80` | http://localhost:8001 |
| `php` | build `docker/php/Dockerfile` (`php:8.2-fpm` + Node 20) | Laravel PHP-FPM + Vite dev server | `5171:5173` | internal (FPM :9000); Vite http://localhost:5171 |
| `node` | build `docker/node/Dockerfile` (`node:20-alpine`) | Realtime Socket.io server | `3001:3000` | http://localhost:3001 |
| `mysql` | `mysql:8.0` | Database (healthchecked) | `3301:3306` | `127.0.0.1:3301` |
| `phpmyadmin` | `phpmyadmin:latest` | Database admin UI | `8881:80` | http://localhost:8881 |

The admin panel is served by nginx at http://localhost:8001/admin/login.

## Environment

Env values live in per-service `.env` files: copy each `.env.example` (root, `app/`, `realtime/`) to `.env` and fill in your own values.

### `app/.env` (Laravel)

| Key | Default | Notes |
|-----|---------|-------|
| `APP_NAME` | `Store` | |
| `APP_ENV` | `local` | |
| `APP_KEY` | `base64:…` | Laravel app key (ships pre-set) |
| `APP_DEBUG` | `true` | |
| `APP_URL` | `http://localhost:8001` | |
| `DB_CONNECTION` | `mysql` | |
| `DB_HOST` | `mysql` | Compose service name |
| `DB_PORT` | `3306` | |
| `DB_DATABASE` | `store` | |
| `DB_USERNAME` | `store_user` | |
| `DB_PASSWORD` | `secret` | |
| `SESSION_DRIVER` | `file` | |
| `CACHE_STORE` | `file` | |
| `REALTIME_SERVER_URL` | `http://node:3000` | Socket.io server (internal) |
| `REALTIME_API_SECRET` | `realtime-secret-key` | Must match the `node` service `API_SECRET` |

**Square Sandbox credentials** — the store boots and renders without keys; only checkout requires them. Set these in `app/.env`, then run `docker compose exec php php artisan config:clear`:

| Key | Default | Notes |
|-----|---------|-------|
| `SQUARE_APPLICATION_ID` | *(empty)* | Sandbox Application ID |
| `SQUARE_ACCESS_TOKEN` | *(empty)* | Sandbox Access Token |
| `SQUARE_LOCATION_ID` | *(empty)* | Sandbox Location ID |
| `SQUARE_ENVIRONMENT` | `sandbox` | |

Get credentials from https://developer.squareup.com/apps (Sandbox mode → Credentials & Locations).

### `realtime/.env` (Socket.io) — also set via compose

| Key | Default |
|-----|---------|
| `PORT` | `3000` |
| `API_SECRET` | `realtime-secret-key` |

### `mysql` (set via `docker-compose.yml` environment)

| Key | Default |
|-----|---------|
| `MYSQL_ROOT_PASSWORD` | `rootpassword` |
| `MYSQL_DATABASE` | `store` |
| `MYSQL_USER` | `store_user` |
| `MYSQL_PASSWORD` | `secret` |

## Volumes & persistence

**Named volumes:**

- `mysql-data` → `/var/lib/mysql` (database data)
- `vendor-data` → `/var/www/html/vendor` (PHP dependencies)
- `node-modules-data` → `/var/www/html/node_modules` (Laravel frontend deps)

**Bind mounts:**

- `./app` → `/var/www/html` (Laravel app source; mounted into both `nginx` and `php`)
- `./docker/nginx/default.conf` → `/etc/nginx/conf.d/default.conf`
- `./realtime` → `/usr/src/app` (realtime server source; `node_modules` masked by an anonymous volume)

## Common commands

```bash
# tail logs (all services, or one)
docker compose logs -f
docker compose logs -f php

# check status (all 5 Up, mysql healthy)
docker compose ps

# open a shell / run artisan
docker compose exec php bash
docker compose exec php php artisan <command>

# re-run migrations + seed
docker compose exec php php artisan migrate --seed --force

# rebuild frontend assets after JS/CSS changes
docker compose exec php npm run build
# or live reload during frontend work (Vite on http://localhost:5171)
docker compose exec php npm run dev

# rebuild images
docker compose up -d --build

# stop & remove containers (keeps mysql/vendor/node volumes)
docker compose down
# also wipe database + dependency volumes
docker compose down -v
```

> If the storefront/admin loads blank or references `http://localhost:517x` (Vite dev), a stale `public/hot` file is forcing dev mode:
> `docker compose exec php rm -f public/hot && docker compose exec php php artisan optimize:clear`

## Verify

```bash
curl -I http://localhost:8001              # store       -> 200
curl -I http://localhost:8001/admin/login  # admin login -> 200
curl -I http://localhost:8881              # phpMyAdmin  -> 200
```

- **Store:** http://localhost:8001
- **Admin panel:** http://localhost:8001/admin/login — seeded account `admin` / `admin`
- **Live payments:** the admin payments page at http://localhost:8001/admin/payments updates in real time as orders come in.

To test a payment, click **Buy Now** on a product and use a Square sandbox card such as `4532 0000 0000 0000` (any future expiry, any CVV, any ZIP). More cards: https://developer.squareup.com/docs/devtools/sandbox/payments

## License

MIT — see [LICENSE](LICENSE).
