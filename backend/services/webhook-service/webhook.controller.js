import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { processPushEvent } from "../github-service/github.service.js";
import crypto from 'crypto';

const webhookController = {};

const verifyGithubSignature = (req) => {
    const signature = req.headers['x-hub-signature-256'];
    const payload = JSON.stringify(req.body);
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!secret) {
        console.warn("GITHUB_WEBHOOK_SECRET is not set. Signature verification skipped (NOT RECOMMENDED for production).");
        return true; 
    }

    if (!signature) return false;

    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
};

webhookController.handleGithubWebhook = asyncHandler(async (req, res) => {
    const event = req.headers['x-github-event'];
    
    // 1. Verify Signature
    // Note: express.json() might interfere with raw body verification if not configured correctly.
    // For simplicity in this dev environment, we assume express provides the body.
    // In production, might need raw-body parser for exact signature matching.
    if (process.env.GITHUB_WEBHOOK_SECRET && !verifyGithubSignature(req)) {
        throw new ApiError(401, "Invalid GitHub Signature");
    }

    console.log(`Received GitHub Webhook Event: ${event}`);

    let result;
    if (event === 'push') {
        result = await processPushEvent(req.body);
    } else if (event === 'ping') {
        result = { message: "Pong! Webhook is working." };
    } else {
        console.log(`Unhandled event type: ${event}`);
        result = { message: "Event ignored" };
    }

    return res.status(200).json(new ApiResponse(200, result, "Webhook processed"));
});

export default webhookController;
