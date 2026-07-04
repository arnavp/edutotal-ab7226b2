import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import type { ApiResponse } from '@/types';

export const validate = (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors,
        } as ApiResponse);
        return;
      }
      next(error);
    }
  };