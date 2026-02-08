import { promises as fs } from 'node:fs';
import path from 'node:path';

export const readJsonFile = async <T>(filePath: string): Promise<T> => {
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data) as T;
};

export const writeJsonFile = async (filePath: string, payload: unknown) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2));
};

export const fileExists = async (filePath: string) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};
