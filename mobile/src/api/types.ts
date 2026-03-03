/** Re-export shared DTOs 为 mobile 使用的类型名（无 Dto 后缀） */
export type {
  PostDto as Post,
  VendorDto as Vendor,
  MenuItemDto as MenuItem,
  OrderDto as Order,
  OrderItemDto as OrderItem,
} from "@scs/api";
