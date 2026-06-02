# 短剧互动播放器 - 部署指南

## 方案一：Docker 一键部署（推荐）

### 前置要求
- Docker 20.10+
- Docker Compose 2.0+

### 部署步骤

1. **克隆项目**
```bash
git clone https://github.com/wuchenxiaodao/short-drama-player.git
cd short-drama-player
```

2. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，修改数据库密码等配置
```

3. **启动服务**
```bash
docker-compose up -d
```

4. **访问应用**
- HTTP: http://localhost
- API: http://localhost/api/

### 服务说明

| 服务 | 端口 | 说明 |
|------|------|------|
| nginx | 80 | 反向代理 |
| backend | 8080 | Spring Boot 后端 |
| mysql | 3306 | MySQL 数据库 |
| redis | 6379 | Redis 缓存 |

### 视频文件

将视频文件放入 `videos/` 目录，按短剧名称组织：
```
videos/
├── 北派寻宝笔记/
│   ├── 第1集.mp4
│   └── 第2集.mp4
└── 天下第一纨绔/
    ├── 第1集.mp4
    └── 第2集.mp4
```

---

## 方案二：H2 本地零依赖启动

### 前置要求
- Java 17+
- Maven 3.6+（或使用内置 mvnw）

### 部署步骤

1. **进入后端目录**
```bash
cd backend
```

2. **编译并运行**
```bash
# Windows
./mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=h2

# Linux/Mac
./mvnw spring-boot:run -Dspring-boot.run.profiles=h2
```

3. **访问应用**
- http://localhost:8080

### 特点
- 无需外部数据库
- 数据存储在内存中，重启后丢失
- 适合开发和演示

---

## 方案三：局域网 PC 部署

### 前置要求
- Java 17+
- 视频文件已准备好

### 部署步骤

1. **编译项目**
```bash
cd backend
./mvnw.cmd clean package -DskipTests
```

2. **启动服务（绑定 0.0.0.0）**
```bash
java -jar target/short-drama-player-1.0.0.jar \
  --spring.profiles.active=h2 \
  --server.address=0.0.0.0
```

3. **局域网访问**
- 找到本机 IP 地址（如 192.168.1.100）
- 其他设备访问 http://192.168.1.100:8080

### 防火墙配置

**Windows:**
```powershell
# 允许 8080 端口
netsh advfirewall firewall add rule name="Short Drama Player" dir=in action=allow protocol=TCP localport=8080
```

**Linux:**
```bash
# Ubuntu/Debian
sudo ufw allow 8080

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

---

## SSL 配置指南

### 生成自签名证书（测试用）

```bash
# 进入 nginx 目录
cd nginx

# 生成证书
./generate-cert.sh

# 或手动创建
mkdir -p certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/key.pem \
  -out certs/cert.pem \
  -subj "/CN=localhost"
```

### 启用 HTTPS

1. 编辑 `nginx/nginx.conf`
2. 取消 HTTPS server 块的注释
3. 修改 `server_name` 为你的域名
4. 重启 nginx 容器

```bash
docker-compose restart nginx
```

### Let's Encrypt 免费证书（生产环境）

```bash
# 安装 certbot
sudo apt install certbot

# 获取证书
sudo certbot certonly --standalone -d your-domain.com

# 证书路径
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

---

## 常见问题排查

### 1. 视频无法播放

**检查视频文件：**
```bash
# 确认视频文件存在
ls -la videos/北派寻宝笔记/

# 确认文件权限
chmod 644 videos/**/*.mp4
```

**检查日志：**
```bash
docker-compose logs backend | grep -i video
```

### 2. 数据库连接失败

**检查 MySQL 状态：**
```bash
docker-compose ps mysql
docker-compose logs mysql
```

**重置数据库：**
```bash
docker-compose down -v
docker-compose up -d
```

### 3. 端口被占用

**查找占用进程：**
```bash
# Windows
netstat -ano | findstr :8080

# Linux/Mac
lsof -i :8080
```

**修改端口：**
编辑 `docker-compose.yml`，修改端口映射：
```yaml
ports:
  - "8081:8080"
```

### 4. 内存不足

**增加 JVM 内存：**
编辑 `docker-compose.yml`，添加环境变量：
```yaml
environment:
  JAVA_OPTS: "-Xmx1g -Xms512m"
```

### 5. CORS 跨域问题

**检查 CORS 配置：**
编辑 `backend/src/main/resources/application.yml`：
```yaml
cors:
  allowed-origins: http://localhost:*,http://your-domain.com
```

---

## 生产环境建议

1. **使用 MySQL**：数据持久化，性能更好
2. **配置 Redis**：缓存热点数据，减轻数据库压力
3. **启用 HTTPS**：保护用户数据安全
4. **定期备份**：备份数据库和视频文件
5. **监控日志**：及时发现和解决问题
6. **CDN 加速**：视频文件使用 CDN 分发

---

## 更新部署

```bash
# 拉取最新代码
git pull origin master

# 重新构建并启动
docker-compose down
docker-compose up -d --build
```

---

## 技术支持

- GitHub Issues: https://github.com/wuchenxiaodao/short-drama-player/issues
