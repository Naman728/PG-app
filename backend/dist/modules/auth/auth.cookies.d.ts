import type { Response } from "express";
export declare const REFRESH_COOKIE = "pm_refresh";
export declare function setRefreshCookie(res: Response, token: string): void;
export declare function clearRefreshCookie(res: Response): void;
