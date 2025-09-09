import argon2 from "argon2";

export class CryptoUtils {
  /**
   * Hash password using Argon2
   */
  static hashPassword = async (password: string): Promise<string> => {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });
  };

  /**
   * Verify password against hash
   */
  static verifyPassword = async (hash: string, password: string): Promise<boolean> => {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      return false;
    }
  };
}
