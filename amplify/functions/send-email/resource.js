"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const backend_1 = require("@aws-amplify/backend");
exports.sendEmail = (0, backend_1.defineFunction)({
    name: 'send-email',
    entry: './handler.ts',
    runtime: 20,
    timeoutSeconds: 30,
    environment: {
        EMAIL_FROM: 'noreply@chinchillaflow.com',
        EMAIL_REGION: 'us-east-1',
    }
});
