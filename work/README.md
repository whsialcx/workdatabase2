# 项目技术栈说明

## 后端框架
- **Spring Boot 3.5.7**: 用于快速构建Java应用程序。

## 构建工具
- **Maven**: 项目构建和依赖管理。

## 编程语言
- **Java 17**: 项目使用的Java版本。

## 数据库
- **PostgreSQL**: 关系型数据库，用于数据持久化。
- **Spring Data JPA**: 用于简化数据库访问，实现对象关系映射（ORM）。

## 缓存
- **Redis**: 内存数据存储，用于缓存和会话管理。
- **Jedis**: Redis的Java客户端。

## 消息队列
- **Apache Kafka**: 分布式流处理平台，用于处理实时数据流。
- **Spring Kafka**: Spring对Kafka的集成支持。

## 邮件服务
- **Spring Boot Starter Mail**: 用于发送邮件。

## 模板引擎
- **Thymeleaf**: 服务器端Java模板引擎，用于渲染HTML。

## 安全
- **Spring Security Crypto**: 提供密码编码和加密功能。

## API文档
- **SpringDoc OpenAPI**: 基于OpenAPI 3规范生成API文档，并集成Swagger UI。

## 监控与管理
- **Spring Boot Actuator**: 用于监控和管理应用程序。
- **Micrometer**: 应用程序指标收集，与Actuator配合使用。

## 开发工具
- **Spring Boot DevTools**: 提供开发时的热部署等功能。

## 测试工具
- **Postman**: 用于API接口测试、调试和文档生成。
- **JMeter**: 用于性能测试、负载测试和压力测试，模拟多用户并发场景。
- **Spring Boot Starter Test**: 用于单元测试和集成测试。

## 容器化与部署
- **Docker**: 容器化技术，用于部署应用程序及其依赖服务。
- **Docker Compose**: 用于定义和运行多容器Docker应用程序。

## 其他依赖
- **Spring Web**: 用于构建Web应用程序，包括RESTful API。

## 配置文件
- 使用`application.properties`作为主配置文件，同时支持`application-test.properties`和`application-production.properties`用于不同环境。

## 部署脚本
- `run.bat`: 用于在Windows环境下启动Spring Boot应用及相关服务（Nginx、Kafka等）。

## 服务编排
- `docker-compose.yml`: 定义了PostgreSQL、Redis、ZooKeeper、Kafka和Spring Boot应用服务的容器化部署配置。

## 项目结构说明
- 项目采用标准的Maven结构，配置文件位于`src/main/resources`目录下。
- 使用Spring Boot的自动配置和起步依赖，简化了项目配置。

## 环境要求
- **Java 17** 或更高版本
- **Maven 3.6** 或更高版本
- **Docker** 和 **Docker Compose**（用于容器化部署）
- **PostgreSQL**、**Redis**、**Kafka**（可通过Docker Compose一键启动）
- **Postman**（可选，用于API测试）
- **JMeter**（可选，用于性能测试）

## 运行方式
1. 使用Maven打包项目：`mvn clean package`
2. 使用Docker Compose启动所有服务：`docker-compose up -d`
3. 或者使用提供的`run.bat`脚本（Windows环境）启动应用及相关服务。

## 测试说明
- **API测试**：可使用Postman导入项目提供的`Postman_Collection.json`（如有）进行接口测试。
- **性能测试**：JMeter测试脚本位于`/src/test/jmeter/`目录下，可用于模拟高并发场景。
- **单元测试**：执行`mvn test`运行项目中的JUnit测试用例。

## 注意事项
- 邮件配置中的密码为授权码，需根据实际邮箱配置进行修改。
- 生产环境配置（如`application-production.properties`）中，服务器端口设置为80，需注意权限问题（Linux/macOS上需要root权限）。