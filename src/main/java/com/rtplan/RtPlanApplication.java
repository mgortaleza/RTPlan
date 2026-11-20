package com.rtplan;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class RtPlanApplication {

    public static void main(String[] args) {
        SpringApplication.run(RtPlanApplication.class, args);
    }
}
