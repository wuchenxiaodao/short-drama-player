#!/bin/bash
# Short Drama Platform - One-click Deployment Script (Linux/macOS)

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

check_prerequisites() {
    info "Checking prerequisites..."

    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first: https://docs.docker.com/get-docker/"
    fi

    if ! docker info &> /dev/null; then
        error "Docker daemon is not running. Please start Docker first."
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi

    if ! command -v openssl &> /dev/null; then
        error "openssl is not installed. Required for certificate generation."
    fi

    info "All prerequisites satisfied."
}

generate_cert() {
    if [ ! -f "nginx/certs/cert.pem" ] || [ ! -f "nginx/certs/key.pem" ]; then
        info "Generating self-signed SSL certificate..."
        bash nginx/generate-cert.sh
    else
        info "SSL certificates already exist, skipping generation."
    fi
}

create_htpasswd() {
    if [ ! -f "nginx/.htpasswd" ]; then
        touch nginx/.htpasswd
        info "Created empty .htpasswd file (basic auth disabled by default)."
    fi
}

create_env() {
    if [ ! -f ".env" ]; then
        info "Creating .env file from .env.example..."
        cp .env.example .env
        warn "Created .env with default values. For production, please update passwords and secrets!"
    else
        info ".env file already exists, skipping."
    fi
}

build_and_start() {
    info "Building Docker images..."
    if docker compose version &> /dev/null; then
        docker compose build
    else
        docker-compose build
    fi

    info "Starting services..."
    if docker compose version &> /dev/null; then
        docker compose up -d
    else
        docker-compose up -d
    fi
}

wait_for_healthy() {
    info "Waiting for services to become healthy..."
    local max_wait=180
    local elapsed=0
    local interval=10

    while [ $elapsed -lt $max_wait ]; do
        local all_healthy=true

        for service in mysql redis backend nextjs nginx; do
            local status
            if docker compose version &> /dev/null; then
                status=$(docker compose ps --format json 2>/dev/null | python3 -c "
import sys, json
for line in sys.stdin:
    obj = json.loads(line)
    if obj.get('Service') == '$service':
        print(obj.get('Health', obj.get('Status', 'unknown')))
" 2>/dev/null || echo "unknown")
            else
                status=$(docker inspect --format='{{.State.Health.Status}}' "drama-$service" 2>/dev/null || echo "unknown")
            fi

            if [ "$status" != "healthy" ]; then
                all_healthy=false
                break
            fi
        done

        if $all_healthy; then
            info "All services are healthy!"
            return 0
        fi

        info "Waiting... (${elapsed}s / ${max_wait}s)"
        sleep $interval
        elapsed=$((elapsed + interval))
    done

    warn "Timeout waiting for services. Some services may not be healthy yet."
    warn "Check status with: docker compose ps"
}

show_access_info() {
    local ip
    ip=$(hostname -I 2>/dev/null | awk '{print $1}' || ipconfig getifaddr en0 2>/dev/null || echo "localhost")

    echo ""
    echo "============================================"
    echo "  Short Drama Platform - Deployment Complete!"
    echo "============================================"
    echo ""
    echo "  Local access:  https://localhost"
    echo "  Network access: https://$ip"
    echo ""
    echo "  API endpoint:  https://localhost/api/"
    echo "  Video endpoint: https://localhost/video/"
    echo ""
    echo "  Note: Browser will show a security warning"
    echo "        for the self-signed certificate."
    echo "        Click 'Advanced' -> 'Proceed' to continue."
    echo ""
    echo "  Useful commands:"
    echo "    View logs:     docker compose logs -f"
    echo "    Stop services:  docker compose down"
    echo "    Restart:        docker compose restart"
    echo "============================================"
}

main() {
    echo ""
    echo "============================================"
    echo "  Short Drama Platform - Deployment Script"
    echo "============================================"
    echo ""

    check_prerequisites
    generate_cert
    create_htpasswd
    create_env
    build_and_start
    wait_for_healthy
    show_access_info
}

main "$@"
