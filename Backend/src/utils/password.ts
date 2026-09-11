import bcrypt from "bcryptjs";
import config from "../config/env.js";

export const hashPassword = async (
  password: string
) => {
  return bcrypt.hash(
    password,
    config.SALT_ROUNDS
  );
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
) => {
  return bcrypt.compare(
    password,
    hashedPassword
  );
};