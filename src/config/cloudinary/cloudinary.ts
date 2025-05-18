import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
import { logger } from "../logger/logger";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

export { cloudinary };
