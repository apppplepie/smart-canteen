package com.scs.controller;

import com.scs.entity.Vendor;
import com.scs.repository.MenuItemMaterialRepository;
import com.scs.repository.VendorRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

/**
 * 按窗口聚合菜品所用食材的过敏原，供食安大屏「今日过敏原公示」使用；查不到数据时前端回退 mock。
 */
@RestController
@RequestMapping("/api")
public class AllergenDisclosureController {

    private final VendorRepository vendorRepo;
    private final MenuItemMaterialRepository menuItemMaterialRepo;

    public AllergenDisclosureController(VendorRepository vendorRepo, MenuItemMaterialRepository menuItemMaterialRepo) {
        this.vendorRepo = vendorRepo;
        this.menuItemMaterialRepo = menuItemMaterialRepo;
    }

    @GetMapping("/allergen-disclosures")
    public List<AllergenDisclosureDto> list() {
        List<Vendor> vendors = vendorRepo.findAll();
        List<AllergenDisclosureDto> result = new ArrayList<>();
        for (Vendor v : vendors) {
            List<String> raw = menuItemMaterialRepo.findDistinctAllergenTagStringsByVendorId(v.getId());
            Set<String> tags = new LinkedHashSet<>();
            for (String s : raw) {
                if (s == null) continue;
                Arrays.stream(s.split("[,，、]"))
                        .map(String::trim)
                        .filter(t -> !t.isEmpty())
                        .forEach(tags::add);
            }
            String window = (v.getName() != null ? v.getName() : "")
                    + (v.getLocationLabel() != null && !v.getLocationLabel().isEmpty() ? " " + v.getLocationLabel() : "");
            if (window.isEmpty()) window = "窗口 " + v.getId();
            result.add(new AllergenDisclosureDto(v.getId(), window, new ArrayList<>(tags)));
        }
        return result;
    }

    public static class AllergenDisclosureDto {
        private Long vendorId;
        private String window;
        private List<String> tags;

        public AllergenDisclosureDto() {}

        public AllergenDisclosureDto(Long vendorId, String window, List<String> tags) {
            this.vendorId = vendorId;
            this.window = window;
            this.tags = tags != null ? tags : List.of();
        }

        public Long getVendorId() { return vendorId; }
        public void setVendorId(Long vendorId) { this.vendorId = vendorId; }
        public String getWindow() { return window; }
        public void setWindow(String window) { this.window = window; }
        public List<String> getTags() { return tags; }
        public void setTags(List<String> tags) { this.tags = tags; }
    }
}
