import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { parseRequestId, runWithRequestId } from "./request-context";

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const { value } = parseRequestId(req.header("x-request-id"));
    res.setHeader("x-request-id", value);
    runWithRequestId(value, () => {
      next();
    });
  }
}
