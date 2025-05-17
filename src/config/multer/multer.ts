import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { AppError } from "../../errors/AppError";
import fs from "fs/promises";

const UPLOAD_DIR = "uploads/resumes/";

async function ensureUploadDirExists() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    throw new AppError("Falha ao criar diretório de uploads", 500);
  }
}

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await ensureUploadDirExists();
      cb(null, UPLOAD_DIR);
    } catch (error) {
      cb(error as Error, UPLOAD_DIR);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = [".pdf", ".doc", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Tipo de arquivo não suportado. Apenas PDF, DOC e DOCX são permitidos.",
        400
      ),
      false
    );
  }
};

export const uploadResume = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

ensureUploadDirExists().catch((error) => {
  console.error("Erro ao verificar diretório de uploads:", error);
});
