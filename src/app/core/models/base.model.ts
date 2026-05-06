export interface BaseResponse<T = any> {
  status: number;
  message: string;
  payload: T;
}

export interface BasePagination<T> {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  content: T[];
}

export interface PaginationRequest {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}
