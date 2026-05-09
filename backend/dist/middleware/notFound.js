import { notFound } from "../common/httpErrors.js";
export const notFoundHandler = (_req, _res, next) => {
    next(notFound("Route not found"));
};
//# sourceMappingURL=notFound.js.map