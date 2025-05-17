// import { NextFunction, Request, Response } from "express";
// import { AppError } from "../errors/AppError";
// import { logger } from "../config/logger/logger";
// import { extractTextFromResume } from "../service/resume/extract-text";
// import { analyzeResumeWithIA } from "../service/resume/analyze-resume";
// import { saveResumeAnalysis } from "../service/resume/save-resume";

// export async function analyzeResumeController(
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction
// ) {
//   try {
//     if (!req.file) {
//       throw new AppError("Nenhum arquivo enviado", 400);
//     }
//     if (!req.user?.id) {
//       throw new AppError("Usuário não autenticado", 401);
//     }

//     logger.info(`Iniciando análise de currículo para usuário ${req.user.id}`);
    
//     const textContent = await extractTextFromResume(req.file.path);
//     logger.debug("Texto extraído do currículo", { length: textContent.length });

//     const analysisResult = await analyzeResumeWithIA(textContent);
//     logger.debug("Resultado da análise", { 
//       technical: analysisResult.technical,
//       funnyComment: analysisResult.funny.comment 
//     });

//     const savedData = await saveResumeAnalysis(
//       req.user.id,
//       req.file.path,
//       req.file.originalname,
//       analysisResult
//     );

//     res.status(200).json({
//       success: true,
//       analysisId: savedData.analysisId,
//       score: savedData.score,
//       funnyComment: analysisResult.funny.comment 
//     });

//   } catch (error) {
//     logger.error("Erro no controller de análise", {
//       error: error instanceof Error ? error.message : error,
//       userId: req.user?.id,
//       file: req.file?.originalname
//     });
//     next(error);
//   }
// }