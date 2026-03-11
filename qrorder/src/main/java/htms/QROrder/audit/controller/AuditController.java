package htms.QROrder.audit.controller;

import htms.QROrder.audit.domain.TableInfo;
import htms.QROrder.audit.service.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@Slf4j
@Controller
@ControllerAdvice
@RequiredArgsConstructor
@RequestMapping("/api/audit/audit")
public class AuditController {

    private final AuditService auditService;

    @GetMapping("/table_info/search")
    public List<TableInfo> getTableInfo(@RequestParam String tableName){

        return auditService.getTableInfo(tableName);
    }
}
