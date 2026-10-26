import bcrypt from "bcryptjs";
import config from "../config/env.js";

export const hashPassword = (password: string) =>
  bcrypt.hash(password, config.SALT_ROUNDS);

export const comparePassword = (password: string, hashed: string) =>
  bcrypt.compare(password, hashed);