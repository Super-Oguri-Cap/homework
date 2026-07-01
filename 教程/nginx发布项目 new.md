# 🚀 Windows 下 Nginx 部署发布项目

## 文档说明

本指南适用于已完成 Vue3 全栈项目开发的学生，指导你在 **Windows 操作系统**下，通过 **Nginx** 将前后端项目部署到**局域网**中，使用 **IP + 端口** 方式访问，实现前后端分离架构的局域网部署。

***

## 一、部署架构概览

在局域网部署场景中，Nginx 作为**统一入口**承担以下角色：

```
局域网内设备 (手机/平板/其他电脑)
    │
    ▼
┌─────────────────────────────────┐
│   Windows 服务器 (本机)          │
│   Nginx 监听端口: 8080          │
├─────────────────────────────────┤
│   /      → 前端静态文件 (dist)   │
│   /api   → 反向代理到 Node.js    │
└─────────────────────────────────┘
    │
    ├──────────┬──────────┐
    ▼          ▼          ▼
前端静态文件  Node.js   本机浏览器
(dist)       后端:3000   访问测试
```


***

## 二、部署前准备

### 2.1 获取本机局域网 IP

```cmd
# 打开命令提示符 (Win + R → cmd)
ipconfig

# 找到 "IPv4 地址"，通常是 192.168.x.x
# 示例: 192.168.1.100
```


记录下这个 IP 地址，后续配置中会用到。

### 2.2 本地环境检查

```cmd
# 检查 Node.js 版本
node -v

# 检查 npm 版本
npm -v

# 检查项目是否能正常构建
cd 你的项目目录
npm run build
```


构建成功后，项目根目录下会生成 `dist` 文件夹，包含所有静态资源。

### 2.3 代码准备

**前端配置**：修改 `src/utils/axios.js` 中的 `baseURL`

```javascript
// src/api/request.js
const request = axios.create({
  // 开发环境用 localhost，生产环境用服务器 IP
  baseURL: import.meta.env.MODE === 'production' 
    ? '/api'  // 👈 改为你的服务器 IP + Nginx 端口
    : 'http://localhost:3000/api',
  timeout: 10000
})
```


<br />

**后端 CORS 配置**：修改 `backend/server.js`

```javascript
// backend/server.js
app.use(cors({
  // 允许局域网内所有设备访问
  origin: '*',  // 或指定具体 IP
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```


***

## 三、Windows 环境配置

### 3.1 安装 Node.js（略）

### 3.2 安装 Nginx（Windows 版）

<br />

1. 访问 [Nginx 下载页面](http://nginx.org/en/download.html)
2. 下载 Windows 版本：`nginx-1.x.x.zip`
3. 解压到 `C:\nginx`（或任意无中文路径的目录）

####

### 3.3 安装 PM2（进程管理）

```cmd
# 全局安装 PM2
npm install -g pm2

# 验证安装
pm2 --version
```


***

## 四、后端部署

### 4.1 确定后端目录

假设你的项目在 `D:\vue-project`，后端代码在 `D:\vue-project\backend`

### 4.2 安装生产依赖

```cmd
cd D:\vue-project\backend
npm install --production
```


### 4.3 使用 PM2 启动后端

```cmd
# 启动后端服务
pm2 start server.js --name "api-service"

# 查看进程状态
pm2 status

# 查看日志（确认启动成功）
pm2 logs api-service
```


### 4.4 验证后端运行

```cmd
# 在服务器本地测试
curl http://localhost:3000
```


或在浏览器访问 `http://localhost:3000`，应返回：

```json
{"code":200,"message":"Server is running","timestamp":"..."}
```


***

## 五、前端部署

### 5.1 构建前端项目

```cmd
cd D:\vue-project
npm run build
```


构建完成后，`dist` 文件夹生成在项目根目录。

### 5.2 准备静态文件目录

建议将 `dist` 文件夹复制到 Nginx 目录下，便于管理：

```cmd
# 在 Nginx 目录下创建前端文件夹
mkdir C:\nginx\html\vue-app

# 复制 dist 内容到该目录
xcopy D:\vue-project\dist\* C:\nginx\html\vue-app\ /E /Y
```


***

## 六、Nginx 配置

### 6.1 修改 Nginx 配置文件

用记事本（或 VSCode）打开 `C:\nginx\conf\nginx.conf`

```cmd
notepad C:\nginx\conf\nginx.conf
```


### 6.2 完整配置内容

**将整个** **`http`** **块中的** **`server`** **块替换为以下内容**：

```nginx
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;

    # ===== Gzip 压缩 =====
    gzip  on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_comp_level 6;

    # =============================================
    # 主服务器配置
    # =============================================
    server {
        # 监听端口（可修改为其他端口，如 8081）
        listen       8080;
        server_name  localhost;

        # ===== 前端静态文件 =====
        root   C:/nginx/html/vue-app;
        index  index.html;

        # ===== 前端路由处理（SPA 关键配置） =====
        location / {
            try_files $uri $uri/ /index.html;
        }

        # ===== 静态资源缓存 =====
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
            access_log off;
        }

        # ===== API 反向代理 =====
        location /api/ {
            proxy_pass http://127.0.0.1:3000/;
            proxy_http_version 1.1;
            
            # 传递真实请求信息
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            
            # 超时设置
            proxy_connect_timeout 60s;
            proxy_read_timeout 60s;
            
            # 解决 CORS（如果后端已配置，可省略）
            add_header Access-Control-Allow-Origin *;
        }

        # ===== 日志配置 =====
        access_log logs/vue-app-access.log;
        error_log logs/vue-app-error.log;
    }
}
```


### 6.3 关键配置说明（Windows 版注意事项）

| 配置项                                | 说明                             | 注意事项                     |
| ---------------------------------- | ------------------------------ | ------------------------ |
| `listen 8080`                      | Nginx 监听端口                     | 避免与 Windows 已有服务端口冲突     |
| `root C:/nginx/html/vue-app`       | 前端文件路径                         | 使用**正斜杠** `C:/` 而非 `C:\` |
| `try_files $uri $uri/ /index.html` | 解决 Vue Router history 模式刷新 404 | ⭐ 必配                     |
| `proxy_pass http://127.0.0.1:3000` | 后端代理地址                         | 末尾斜杠 `/` 很关键             |

> ⚠️ **路径格式注意**：Windows 下 Nginx 配置路径必须使用**正斜杠** `/`，否则会报错。

***

## 七、启动服务

### 7.1 启动 Nginx

```cmd
# 进入 Nginx 目录
cd C:\nginx

# 启动 Nginx
start nginx

# 或者使用命令行启动
nginx.exe
```


### 7.2 Nginx 常用命令（Windows）

| 操作     | 命令                          |
| ------ | --------------------------- |
| 启动     | `start nginx` 或 `nginx.exe` |
| 停止     | `nginx -s stop`             |
| 重新加载配置 | `nginx -s reload`           |
| 测试配置语法 | `nginx -t`                  |
| 查看版本   | `nginx -v`                  |

> 💡 **提示**：修改配置后，使用 `nginx -t` 测试语法，然后 `nginx -s reload` 重新加载，无需重启。

### 7.3 验证所有服务

| 服务     | 验证方式                    | 预期结果    |
| ------ | ----------------------- | ------- |
| 后端     | `http://localhost:3000` | 返回 JSON |
| Nginx  | `http://localhost:8080` | 显示首页    |
| API 代理 | `http://localhost:8080` | 返回 JSON |

***

## 八、局域网访问测试

### 8.1 本机访问

在浏览器中输入：

```
http://localhost:8080
```


或使用本机 IP：

```
http://192.168.1.100:8080
```


### 8.2 局域网其他设备访问

**同一 WiFi 下的其他设备**（手机、平板、其他电脑）：

在浏览器中输入：

```
http://192.168.1.100:8080
```


将 `192.168.1.100` 替换为你的实际服务器 IP 地址。

### 8.3 防火墙配置（重要！）

如果其他设备无法访问，可能是 Windows 防火墙阻止了端口。

**方法一：关闭防火墙（不推荐）**

**方法二：添加入站规则（推荐）**

1. 打开 **控制面板** → **Windows Defender 防火墙** → **高级设置**
2. 点击 **入站规则** → **新建规则**
3. 选择 **端口** → **下一步**
4. 选择 **TCP**，输入 **特定本地端口：8080,3000**
5. 选择 **允许连接** → **下一步**
6. 全部勾选（域、专用、公用）→ **下一步**
7. 输入名称：`Nginx & Node.js` → **完成**

```cmd
# 或使用命令行快速添加（管理员模式）
netsh advfirewall firewall add rule name="Nginx Port" dir=in action=allow protocol=TCP localport=8080
netsh advfirewall firewall add rule name="Node.js Port" dir=in action=allow protocol=TCP localport=3000
```


### 8.4 验证局域网访问

用手机连接同一 WiFi，在浏览器输入 `http://服务器IP:8080`，应该可以正常访问项目。

***

##
