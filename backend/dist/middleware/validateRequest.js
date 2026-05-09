import { badRequest } from "../common/httpErrors.js";
export function validateBody(schema) {
    return (req, _res, next) => {
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            next(badRequest("Validation failed", parsed.error.flatten()));
            return;
        }
        req.body = parsed.data;
        next();
    };
}
//# sourceMappingURL=validateRequest.js.map