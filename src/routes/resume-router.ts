import { Router } from "express";
import { checkToken } from "../utils/checkToken";
import { uploadResume } from "../config/multer/multer";
import { analyzeResumeController } from "../controllers/resume-controller";

const resumeRouter = Router();

resumeRouter.post("/analyze", checkToken, uploadResume.single("resume"), analyzeResumeController);

export {resumeRouter}