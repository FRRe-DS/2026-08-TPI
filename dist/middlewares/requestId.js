"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = void 0;
const uuid_1 = require("uuid");
const requestIdMiddleware = (req, res, next) => {
    const incomingId = req.header('X-Request-Id') || req.header('x-request-id');
    const requestId = (incomingId && incomingId.trim().length > 0) ? incomingId.trim() : (0, uuid_1.v4)();
    req.id = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
};
exports.requestIdMiddleware = requestIdMiddleware;
