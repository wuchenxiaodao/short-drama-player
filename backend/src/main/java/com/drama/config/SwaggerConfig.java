package com.drama.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("短剧互动播放器 API")
                        .version("1.0.0")
                        .description("短剧互动播放器后端 API 文档")
                        .contact(new Contact()
                                .name("Developer")
                                .email("developer@example.com")));
    }
}
