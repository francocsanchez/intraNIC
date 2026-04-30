import crypto from "crypto";

const PASSWORD_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const PASSWORD_LENGTH = 8;

export function generateTemporaryPassword() {
  let password = "";

  for (let i = 0; i < PASSWORD_LENGTH; i++) {
    const index = crypto.randomInt(0, PASSWORD_CHARS.length);
    password += PASSWORD_CHARS[index];
  }

  return password;
}
