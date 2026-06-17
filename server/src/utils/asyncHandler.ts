import type { NextFunction, Request, Response } from "express";

type AsyncFn<P extends Record<string, string> = Record<string, string>> = (
  req: Request<P>,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export const asyncHandler = <P extends Record<string, string> = Record<string, string>>(
  fn: AsyncFn<P>
) => {
  return (req: Request<P>, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
