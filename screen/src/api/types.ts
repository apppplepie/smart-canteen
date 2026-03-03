/**
 * 与 backend 实体对应的前端类型（JSON 使用 camelCase）
 */

export interface VendorDto {
  id: number;
  name: string;
  description?: string;
  locationLabel?: string;
  contactInfo?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
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
  isAvailable?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface QueueEntryDto {
  id: number;
  vendorId: number;
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
  testedAt?: string;
  createdAt?: string;
}

export interface RetainedSampleDto {
  id: number;
  sampleCode?: string;
  vendorId?: number;
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

export interface PostDto {
  id: number;
  userId?: number;
  vendorId?: number;
  title?: string;
  content?: string;
  mediaUrls?: string;
  likeCount?: number;
  commentCount?: number;
  createdAt?: string;
}

export interface CallEventDto {
  id: number;
  queueEntryId?: number;
  vendorId?: number;
  eventType?: string;
  message?: string;
  createdAt?: string;
}
