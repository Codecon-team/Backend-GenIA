import { Router } from "express";
import { checkToken } from "../utils/checkToken";
import { uploadResume } from "../config/multer/multer";
import { analyzeResumeController, getOnlyResumeController, getResumeAnalysis } from "../controllers/resume-controller";

const resumeRouter = Router();

resumeRouter.post("/analyze", checkToken, uploadResume.single("resume"), analyzeResumeController);
resumeRouter.get("/", checkToken, getResumeAnalysis);
resumeRouter.get("/:id", checkToken, getOnlyResumeController);

export {resumeRouter}