package vn.edu.fpt.safe_senior;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SafeSeniorApplication {

	public static void main(String[] args) {
		SpringApplication.run(SafeSeniorApplication.class, args);
	}

}
