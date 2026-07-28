import { Router } from "express";
import {
  createProblem,
  checkSlugAvailability,
  getAllProblems,
  getProblemBySlugOrId,
  updateProblem,
  archiveProblem,
  compileProblemPackage,
  publishProblemPackage
} from "./problem.controller.js";

import {
  getCompanies,
  createCompany,
  deleteCompany,
  getTopics,
  createTopic,
  deleteTopic,
  getPatterns,
  createPattern,
  deletePattern,
  seedDefaults,
  getLanguages,
  createLanguage
} from "./companyTopic.controller.js";

const router = Router();

// Problem Package Compilation & Publishing Routes
router.post("/package/compile", compileProblemPackage);
router.post("/package/publish", publishProblemPackage);

// Problem Routes
router.post("/", createProblem);
router.get("/check-slug", checkSlugAvailability);
router.get("/", getAllProblems);
router.get("/:identifier", getProblemBySlugOrId);
router.put("/:id", updateProblem);
router.delete("/:id", archiveProblem);

// Metadata & Tag Routes
router.get("/meta/companies", getCompanies);
router.post("/meta/companies", createCompany);
router.delete("/meta/companies/:id", deleteCompany);

router.get("/meta/topics", getTopics);
router.post("/meta/topics", createTopic);
router.delete("/meta/topics/:id", deleteTopic);

router.get("/meta/patterns", getPatterns);
router.post("/meta/patterns", createPattern);
router.delete("/meta/patterns/:id", deletePattern);

router.post("/meta/seed-defaults", seedDefaults);

router.get("/meta/languages", getLanguages);
router.post("/meta/languages", createLanguage);

export default router;
