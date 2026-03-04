package com.scs.repository;

import com.scs.entity.MenuItemMaterial;
import com.scs.entity.MenuItemMaterialId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MenuItemMaterialRepository extends JpaRepository<MenuItemMaterial, MenuItemMaterialId> {

    List<MenuItemMaterial> findByMenuItemId(Long menuItemId);

    List<MenuItemMaterial> findByMaterialId(Long materialId);

    /** 某窗口菜品用到的食材里，所有出现过的 allergen_tags 字符串（逗号分隔，服务层需拆分去重） */
    @Query("SELECT DISTINCT mim.material.allergenTags FROM MenuItemMaterial mim WHERE mim.menuItem.vendor.id = :vendorId AND mim.material.allergenTags IS NOT NULL AND mim.material.allergenTags != ''")
    List<String> findDistinctAllergenTagStringsByVendorId(@Param("vendorId") Long vendorId);
}
