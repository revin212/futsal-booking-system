package com.yourorg.futsal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FutsalApplication {
  public static void main(String[] args) {
    SpringApplication.run(FutsalApplication.class, args);
  }
}

