import type { Response } from "express";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const sendSuccess = (res: Response, data: any, message: string = "Success", meta?: PaginationMeta) => {
  return res.status(200).json({
    success: true,
    data,
    message,
    ...(meta && { meta }),
  });
};

export const sendError = (res: Response, error: string, status: number = 500, code?: string) => {
  return res.status(status).json({
    success: false,
    error,
    ...(code && { code }),
  });
};

export const paginate = (total: number, page: number, limit: number) => {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};
