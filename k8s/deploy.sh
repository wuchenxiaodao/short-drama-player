#!/bin/bash
set -euo pipefail

REGISTRY="${DOCKER_REGISTRY:-your-registry.com}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
NAMESPACE="${K8S_NAMESPACE:-default}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; }

rollback() {
  err "部署失败，正在回滚..."
  kubectl rollout undo deployment/drama-backend -n "$NAMESPACE" 2>/dev/null || true
  kubectl rollout undo deployment/mysql -n "$NAMESPACE" 2>/dev/null || true
  kubectl rollout undo deployment/redis -n "$NAMESPACE" 2>/dev/null || true
  err "回滚完成"
}
trap rollback ERR

wait_for_rollout() {
  local name=$1 timeout=${2:-120}
  log "等待 $name 部署完成（${timeout}s 超时）..."
  kubectl rollout status deployment/"$name" -n "$NAMESPACE" --timeout="${timeout}s"
}

check_pod_health() {
  local label=$1 timeout=${2:-90}
  log "等待 $label Pod 就绪（${timeout}s 超时）..."
  kubectl wait --for=condition=ready pod -l "app=$label" -n "$NAMESPACE" --timeout="${timeout}s"
}

echo "=== 短剧播放器 Kubernetes 部署 ==="
echo "Registry: $REGISTRY"
echo "Tag: $IMAGE_TAG"
echo "Namespace: $NAMESPACE"
echo ""

# Step 1: Build and push
log "构建后端 Docker 镜像..."
docker build -t "$REGISTRY/drama-backend:$IMAGE_TAG" "$SCRIPT_DIR/../backend"
docker push "$REGISTRY/drama-backend:$IMAGE_TAG"

# Step 2: Create secrets if not exist
if ! kubectl get secret drama-secrets -n "$NAMESPACE" &>/dev/null; then
  warn "drama-secrets 不存在，请先创建："
  echo "  kubectl create secret generic drama-secrets -n $NAMESPACE \\"
  echo "    --from-literal=mysql-root-password=YOUR_PASSWORD \\"
  echo "    --from-literal=redis-password=YOUR_PASSWORD \\"
  echo "    --from-literal=jwt-secret=YOUR_JWT_SECRET"
  exit 1
fi

# Step 3: Apply configs
log "应用 Kubernetes 配置..."
kubectl apply -f "$SCRIPT_DIR/mysql.yaml" -n "$NAMESPACE"
kubectl apply -f "$SCRIPT_DIR/redis.yaml" -n "$NAMESPACE"
kubectl apply -f "$SCRIPT_DIR/backend.yaml" -n "$NAMESPACE"

# Step 4: Wait for health
check_pod_health mysql 120
check_pod_health redis 30
check_pod_health drama-backend 90

# Step 5: Verify backend
log "验证后端服务..."
BACKEND_POD=$(kubectl get pod -l app=drama-backend -n "$NAMESPACE" -o jsonpath='{.items[0].metadata.name}')
kubectl exec "$BACKEND_POD" -n "$NAMESPACE" -- curl -sf http://localhost:8080/api/drama/recommend?page=0\&size=1 > /dev/null

echo ""
log "=== 部署完成 ==="
kubectl get pods -n "$NAMESPACE"
echo ""
log "查看服务地址: kubectl get svc drama-backend-service -n $NAMESPACE"
