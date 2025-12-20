# Dockerfile.huawei
# 使用华为云镜像源的openjdk
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/openjdk:17-jdk-alpine

WORKDIR /app

# 安装必要的工具
RUN apk add --no-cache bash curl netcat-openbsd

# 复制构建好的jar文件
COPY target/library.jar app.jar

# 复制等待脚本
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# 暴露端口
EXPOSE 8080

# 运行应用，添加等待逻辑
# ENTRYPOINT ["/bin/sh", "-c", "/wait-for-it.sh postgres:5432 -- /wait-for-it.sh redis:6379 -- /wait-for-it.sh kafka:9092 -- java -jar app.jar"]
ENTRYPOINT ["java", "-jar", "app.jar"]