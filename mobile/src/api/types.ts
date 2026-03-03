// Backend entity shapes (match Java entities / JSON)

export interface Post {
  id: number;
  userId?: number;
  vendorId?: number;
  title?: string;
  content: string;
  mediaUrls?: string; // JSON string, e.g. '["url1","url2"]'
  likeCount: number;
  commentCount: number;
  createdAt: string; // ISO datetime
}

export interface Vendor {
  id: number;
  name: string;
  description?: string;
  locationLabel?: string;
  contactInfo?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive: boolean;
}

export interface MenuItem {
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
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: number;
  userId?: number;
  vendorId?: number;
  totalAmount: number;
  status: string;
  queueNumber?: string;
  placedAt: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: number;
  orderId?: number;
  menuItemId?: number;
  quantity: number;
  priceEach: number;
  createdAt?: string;
}
