import { apiGet, apiPost } from "./client";

export interface VendorReviewDto {
  id?: number;
  userId: number;
  vendorId: number;
  orderId?: number;
  rating: number;
  content?: string;
  createdAt?: string;
}

export async function createVendorReview(body: {
  userId: number;
  vendorId: number;
  orderId?: number;
  rating: number;
  content?: string;
}): Promise<VendorReviewDto> {
  return apiPost<VendorReviewDto>("/api/vendor-reviews", body);
}

export async function listVendorReviewsByVendor(vendorId: number): Promise<VendorReviewDto[]> {
  return apiGet<VendorReviewDto[]>(`/api/vendor-reviews/vendor/${vendorId}`);
}
