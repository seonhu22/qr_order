package htms.QROrder.home.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping(value = {"/", "/login", "/dashboard", "/dashboard/**"})
    public String index() {
        return "forward:/index.html";
    }
}
