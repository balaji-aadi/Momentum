import { Router } from 'express';
import webhookController from '../services/webhook-service/webhook.controller.js';

const router = Router();

router.route('/github').post(webhookController.handleGithubWebhook);

export default router;
