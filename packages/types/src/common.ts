// ============================================
// Common shared types
// ============================================

/** Standard paginated query parameters */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/** Standard paginated response metadata */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Standard API success response */
export interface ApiResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

/** Standard API error response */
export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: ValidationError[];
  requestId?: string;
}

/** Validation error detail */
export interface ValidationError {
  field: string;
  message: string;
}

/** Base entity with timestamps */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/** Select option (for dropdowns) */
export interface SelectOption {
  label: string;
  value: string;
}
