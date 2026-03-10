/**
 * 与 backend 实体对应的前端 DTO（与 Spring/Jackson 序列化一致，camelCase）
 */

export interface UserDto {
  id: number;
  username: string;
  displayName?: string;
  email?: string;
  phone?: string;
  role?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VendorDto {
  id: number;
  name: string;
  description?: string;
  locationLabel?: string;
  contactInfo?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  /** 展示用：无评分时后端返回 4.5，有评分时为该商家所有评分的平均值 */
  averageRating?: number;
}

export interface MenuItemDto {
  id: number;
  vendorId: number;
  name: string;
  description?: string;
  price: number;
  prepTimeSeconds?: number;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  imageUrl?: string;
  isAvailable?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MaterialDto {
  id: number;
  vendorId?: number;
  name: string;
  allergenTags?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PostDto {
  id: number;
  userId?: number;
  vendorId?: number;
  title?: string;
  /** food=菜品建议, service=服务态度, env=环境卫生, other=其他 */
  feedbackType?: string;
  /** feedback=反馈, dynamics=食堂圈动态 */
  postType?: string;
  content?: string;
  imageUrl?: string;
  mediaUrls?: string;
  likeCount?: number;
  commentCount?: number;
  /** 当前用户是否已点赞（仅 get 单条时可能返回） */
  likedByCurrentUser?: boolean;
  /** 发帖用户展示名（列表/详情时由后端填充） */
  userDisplayName?: string;
  /** 发帖用户头像 URL（列表/详情时由后端填充） */
  userImageUrl?: string;
  status?: string;
  replyContent?: string;
  /** AI建议（预留，可为空） */
  aiSuggestion?: string;
  createdAt?: string;
}

export interface FoundItemDto {
  id: number;
  title: string;
  location?: string;
  description?: string;
  imageUrl?: string;
  createdAt?: string;
}

export interface LostItemDto {
  id: number;
  userName?: string;
  userId?: number;
  itemName: string;
  location?: string;
  description?: string;
  imageUrl?: string;
  createdAt?: string;
}

export interface OrderDto {
  id: number;
  userId?: number;
  vendorId?: number;
  totalAmount: number;
  status: string;
  queueNumber?: string;
  placedAt?: string;
  updatedAt?: string;
}

export interface OrderItemDto {
  id: number;
  orderId?: number;
  menuItemId?: number;
  quantity: number;
  priceEach?: number;
  createdAt?: string;
}

export interface QueueEntryDto {
  id: number;
  vendorId?: number;
  userId?: number;
  queueNumber: string;
  status: string;
  createdAt?: string;
  calledAt?: string;
  servedAt?: string;
}

export interface TestReportDto {
  id: number;
  sampleId?: string;
  vendorId?: number;
  itemType?: string;
  result?: string;
  numericValue?: number;
  unit?: string;
  labName?: string;
  reportUrl?: string;
  imageUrl?: string;
  testedAt?: string;
  createdAt?: string;
}

export interface RetainedSampleDto {
  id: number;
  sampleCode?: string;
  vendorId?: number;
  /** 后端连库返回的供应商名称 */
  vendorName?: string;
  collectedAt?: string;
  storageLocation?: string;
  status?: string;
  createdAt?: string;
}

export interface SensorLogDto {
  id: number;
  deviceId?: string;
  metric?: string;
  value?: number;
  unit?: string;
  recordedAt?: string;
}

export interface CallEventDto {
  id: number;
  queueEntryId?: number;
  vendorId?: number;
  eventType?: string;
  message?: string;
  createdAt?: string;
}

/** 按窗口的过敏原公示（/api/allergen-disclosures） */
export interface AllergenDisclosureDto {
  vendorId: number;
  window: string;
  tags: string[];
}
