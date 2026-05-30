# 云服务器部署指南

## 一、买服务器

阿里云 ECS 或腾讯云 CVM，最低配置即可（2核2G，约 ¥60/月）。

关键选择：
- **系统**：Ubuntu 22.04（推荐）或 CentOS 7.9
- **带宽**：按量计费，1Mbps 起步
- **安全组**：放行 22（SSH）、80（HTTP）、443（HTTPS）端口

拿到公网 IP，比如 `47.100.xx.xx`。

---

## 二、连上服务器

```bash
ssh root@你的公网IP
```

---

## 三、装环境

```bash
# Python
apt update && apt install -y python3 python3-pip python3-venv

# Nginx
apt install -y nginx

# Node.js（仅用于构建前端）
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

---

## 四、上传项目

从本地电脑把代码传到服务器：

```bash
# 在本地机器上执行
scp -r backend/ root@你的公网IP:/opt/consumer-robot/backend/
scp -r frontend/ root@你的公网IP:/opt/consumer-robot/frontend/
```

---

## 五、构建前端

```bash
cd /opt/consumer-robot/frontend
npm install
npm run build
# 产物在 frontend/dist/ 目录
```

---

## 六、配置 Nginx

创建 `/etc/nginx/sites-available/consumer-robot`：

```nginx
server {
    listen 80;
    server_name 你的域名或IP;

    # 前端静态文件
    location / {
        root /opt/consumer-robot/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API 代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

启用并重启：

```bash
ln -s /etc/nginx/sites-available/consumer-robot /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
```

---

## 七、用 systemd 守护后端

创建 `/etc/systemd/system/consumer-robot.service`：

```ini
[Unit]
Description=Consumer Finance Robot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/consumer-robot/backend
ExecStart=/usr/bin/python3 -m uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

启动：

```bash
systemctl daemon-reload
systemctl enable consumer-robot
systemctl start consumer-robot
```

---

## 八、绑域名 + HTTPS（可选）

1. DNS 解析 A 记录指向服务器 IP
2. 用 Certbot 自动获取免费 SSL 证书：

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

---

## 完成

浏览器访问 `http://你的公网IP` 或绑定好的域名，即可在任何设备上使用。
