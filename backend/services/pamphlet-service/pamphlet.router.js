import { Router } from "express";
import { getDsaPamphlet, syncDsaPamphlet } from "./pamphlet.controller.js";
import { verifyJWT } from "../../middlewares/auth.middleware.js";

const router = Router();

// Routes require authentication
router.use(verifyJWT);

router.get("/dsa", getDsaPamphlet);
router.post("/dsa/sync", syncDsaPamphlet);

export default router;
