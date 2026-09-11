import { CorsOptions } from "cors";
import config from "./env.js";

const corsOptions: CorsOptions = {
  origin: config.CLIENT_URL,
  credentials: true,
};

export default corsOptions;