package com.scs.controller.v1;

import com.scs.dto.ApiResult;
import com.scs.dto.TableDataDto;
import com.scs.entity.User;
import com.scs.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 提供 v3-admin-vite 表格 demo 所需的 /api/v1/tables 增删改查，与前端约定的统一响应格式。
 */
@RestController
@RequestMapping("/api/v1")
public class TablesController {

    private final UserRepository userRepository;

    public TablesController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** 分页列表：?currentPage=1&size=10&username=&phone= */
    @GetMapping("/tables")
    public ApiResult<Map<String, Object>> list(
            @RequestParam(defaultValue = "1") int currentPage,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String phone) {
        String u = username != null ? username : "";
        String p = phone != null ? phone : "";
        var page = userRepository.findByIsDeletedFalseAndUsernameContainingAndPhoneContaining(
                u, p, PageRequest.of(currentPage - 1, size));
        var list = page.getContent().stream().map(TableDataDto::fromUser).toList();
        return ApiResult.ok(Map.of("list", list, "total", page.getTotalElements()));
    }

    /** 增 */
    @PostMapping("/tables")
    public ApiResult<TableDataDto> create(@RequestBody Map<String, Object> body) {
        User user = new User();
        user.setUsername(required(body, "username"));
        user.setEmail((String) body.get("email"));
        user.setPhone((String) body.get("phone"));
        user.setRole((String) body.getOrDefault("roles", "student"));
        User saved = userRepository.save(user);
        return ApiResult.ok(TableDataDto.fromUser(saved));
    }

    /** 改：前端 PUT 带 body.id */
    @PutMapping("/tables")
    public ApiResult<TableDataDto> update(@RequestBody Map<String, Object> body) {
        Object idObj = body.get("id");
        if (idObj == null)
            return ApiResult.fail(400, "缺少 id");
        long id = idObj instanceof Number n ? n.longValue() : Long.parseLong(idObj.toString());
        User existing = userRepository.findById(id).orElse(null);
        if (existing == null)
            return ApiResult.fail(404, "用户不存在");
        if (body.containsKey("username")) existing.setUsername((String) body.get("username"));
        if (body.containsKey("email")) existing.setEmail((String) body.get("email"));
        if (body.containsKey("phone")) existing.setPhone((String) body.get("phone"));
        if (body.containsKey("roles")) existing.setRole((String) body.get("roles"));
        User saved = userRepository.save(existing);
        return ApiResult.ok(TableDataDto.fromUser(saved));
    }

    /** 删 */
    @DeleteMapping("/tables/{id}")
    public ApiResult<Void> delete(@PathVariable(name = "id") Long id) {
        if (id != null)
            userRepository.findById(id).ifPresent(u -> {
                u.setIsDeleted(true);
                userRepository.save(u);
            });
        return ApiResult.ok(null);
    }

    private static String required(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null || (v instanceof String s && s.isBlank()))
            throw new IllegalArgumentException("缺少 " + key);
        return v.toString();
    }
}
