import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

// This function hashes a password using bcrypt
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
}


// This function compares a plain text password with a hashed password
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
} 