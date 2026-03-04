package com.scs.entity;

import java.io.Serializable;
import java.util.Objects;

public class MenuItemMaterialId implements Serializable {

    private Long menuItemId;
    private Long materialId;

    public MenuItemMaterialId() {}

    public MenuItemMaterialId(Long menuItemId, Long materialId) {
        this.menuItemId = menuItemId;
        this.materialId = materialId;
    }

    public Long getMenuItemId() { return menuItemId; }
    public void setMenuItemId(Long menuItemId) { this.menuItemId = menuItemId; }
    public Long getMaterialId() { return materialId; }
    public void setMaterialId(Long materialId) { this.materialId = materialId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        MenuItemMaterialId that = (MenuItemMaterialId) o;
        return Objects.equals(menuItemId, that.menuItemId) && Objects.equals(materialId, that.materialId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(menuItemId, materialId);
    }
}
