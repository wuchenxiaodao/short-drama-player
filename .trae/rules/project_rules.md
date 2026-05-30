# 短剧播放平台 - 项目规则

## 技术栈
- 后端: Spring Boot 3.2.5 + JPA/Hibernate + H2/MySQL
- 前端: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Zustand
- 部署: Docker Compose (nginx + nextjs + backend + mysql + redis)

## 后端规范
- API 路径统一前缀 `/api/`
- 分页查询返回 Spring Data Page 格式: `{content: [], totalElements, totalPages, number, size}`
- 页码从 0 开始 (Spring Data 默认)
- Entity 使用 Lombok @Getter/@Setter，不使用 @Data
- Controller 返回 ResponseEntity<ApiResponse<T>>
- 异常通过 @ControllerAdvice + @ExceptionHandler 统一处理
- CORS 配置在 SecurityConfig.java 和 WebConfig.java 两处
- 视频文件存储在项目根目录 `videos/` 下，通过 WebConfig 映射为 `/videos/**`

## 前端规范
- 所有页面使用 'use client' 指令（因为依赖浏览器 API）
- API 调用统一通过 `src/lib/api-client.ts`
- 视频等资源 URL 使用 `resolveUrl()` 函数解析相对路径
- 认证状态使用 Zustand + persist 中间件 (`src/lib/auth.ts`)
- 深色主题，主色调: primary (粉色系 #ec4899), drama-bg (#0f0f1a)
- 移动端优先设计，响应式布局

## 测试与验证
- 后端构建: `cd backend && .\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=h2`
- 前端构建: `cd frontend && npx next dev -p 3000 -H 0.0.0.0`
- 后端需要绑定 0.0.0.0 才能从模拟器访问: `--server.address=0.0.0.0`
- 模拟器使用 10.0.2.2 访问宿主机 localhost

## 常见陷阱
- Spring Data 分页页码从 0 开始，前端注意不要用 1-based
- 前端 API 返回的 Page 对象需要取 `.content` 才是数据数组
- Android 模拟器的 localhost 指向模拟器自身，需要用 10.0.2.2 访问宿主机
- Next.js 环境变量 NEXT_PUBLIC_* 在构建时注入，运行时修改无效
- 视频文件 URL 在种子数据中存储为相对路径，前端需要 resolveUrl() 拼接后端地址
