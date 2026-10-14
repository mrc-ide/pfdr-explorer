import { type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';

export class AppError extends Error {
  status?: number;
  constructor(message: string, status: number) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.status = status;
  }
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(err);
  if (err instanceof z.ZodError) {
    res.status(400).json({ error: z.prettifyError(err) });
    return;
  }
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
};
