import type { Response } from "express";
interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export declare const sendSuccess: (res: Response, data: any, message?: string, meta?: PaginationMeta) => Response<any, Record<string, any>>;
export declare const sendError: (res: Response, error: string, status?: number, code?: string) => Response<any, Record<string, any>>;
export declare const paginate: (total: number, page: number, limit: number) => {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};
export {};
//# sourceMappingURL=response.d.ts.map