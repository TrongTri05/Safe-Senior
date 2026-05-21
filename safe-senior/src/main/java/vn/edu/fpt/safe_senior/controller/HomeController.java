package vn.edu.fpt.safe_senior.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.ModelAndView;

@RestController
@RequestMapping("/home")
public class HomeController {
    @GetMapping
    public ModelAndView home() {
        return new ModelAndView("user/home");
    }
}
