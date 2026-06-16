package vn.edu.fpt.safe_senior.controller.AdminController;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/adminHome")
public class AdminHomeController {
    @GetMapping
    public String adminHome() {
        return "admin/admin";
    }
}
