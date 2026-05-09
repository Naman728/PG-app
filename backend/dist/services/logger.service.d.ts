import winston from "winston";
export declare const logger: winston.Logger;
/** Stream for Morgan HTTP access logs (Winston). */
export declare const httpAccessLogStream: {
    write(message: string): void;
};
