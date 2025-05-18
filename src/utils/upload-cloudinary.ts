import path from "path";
import { AppError } from "../errors/AppError";
import { logger } from "../config/logger/logger";
import { cloudinary } from "../config/cloudinary/cloudinary";

export async function uploadResumeToCloudinary(filePath: string) {
  try {

    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "raw", // importante para arquivos não-imagem
      folder: "resumes",     // opcional: cria uma pasta no Cloudinary
      use_filename: true,
      unique_filename: false,
    });
    logger.info(`Currículo enviado para o Cloudinary com sucesso: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    throw new AppError("Erro ao fazer upload do currículo para o Cloudinary", 500);
  }
}
