package com.workdatebase.work.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.ExternalDocumentation;

@Configuration
public class OpenAiConfig {

    @Bean
    public OpenAPI customOpenAPI(){
        return new OpenAPI()
                   .info(new Info()
                    .title("图书管理系统API文档")
                    .version("1.0")
                    .description("图书管理系统接口文档，包含用户管理、图书管理和借阅管理等功能的API说明。")
                    .contact(new Contact()
                        .name("图书管理系统开发团队")
                        .email("3247365462@qq.com")))
                    .externalDocs(new ExternalDocumentation()
                        .description("项目GitHub地址")
                        .url("..."));
    }
}
