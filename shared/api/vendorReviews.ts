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
  const content =
    body.content != null && String(body.content).trim() !== ""
      ? String(body.content).trim()
      : undefined;
  return apiPost<VendorReviewDto>("/api/vendor-reviews", {
    userId: body.userId,
    vendorId: body.vendorId,
    orderId: body.orderId,
    rating: body.rating,
    ...(content !== undefined ? { content } : {}),
  });
}

export async function listVendorReviewsByVendor(vendorId: number): Promise<VendorReviewDto[]> {
  return apiGet<VendorReviewDto[]>(`/api/vendor-reviews/vendor/${vendorId}`);
}
