#!/usr/bin/env node
/**
 * Generates JWT and other internal secrets (no third-party keys).
 * Updates .env: only replaces placeholders, never overwrites existing real values.
 */

import { randomBytes } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
const examplePath = path.join(__dirname, '..', '.env.example');

const PLACEHOLDERS = {
  JWT_SECRET: [
    'your-super-secret-jwt-key-change-this-in-production',
    'change-this-in-production',
    'your-jwt-secret',
  ],
};

function generateJwtSecret() {
  return randomBytes(32).toString('hex');
}

function shouldReplace(key, value) {
  if (!value || typeof value !== 'string') return true;
  const v = value.trim();
  const placeholders = PLACEHOLDERS[key];
  if (!placeholders) return false;
  return placeholders.some((p) => v === p || v.toLowerCase().includes('change-this') || v.toLowerCase().includes('your-'));
}

function getEnvContent() {
  if (existsSync(envPath)) {
    return readFileSync(envPath, 'utf8');
  }
  if (existsSync(examplePath)) {
    const content = readFileSync(examplePath, 'utf8');
    writeFileSync(envPath, content, 'utf8');
    console.log('Created .env from .env.example');
    return content;
  }
  throw new Error('No .env or .env.example found');
}

function parseAndUpdate(content) {
  const replacements = {};
  const jwtMatch = content.match(/^JWT_SECRET=([^\r\n]*)/m);
  const currentJwt = jwtMatch ? jwtMatch[1].trim() : '';
  if (shouldReplace('JWT_SECRET', currentJwt)) {
    replacements.JWT_SECRET = generateJwtSecret();
  }

  let updated = content;
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`^(${key})=[^\r\n]*`, 'm');
    updated = updated.replace(regex, `$1=${value}`);
  }

  return { updated, replacements };
}

function main() {
  try {
    const content = getEnvContent();
    const { updated, replacements } = parseAndUpdate(content);
    if (Object.keys(replacements).length === 0) {
      console.log('Secrets already set (no placeholders replaced).');
      return;
    }
    writeFileSync(envPath, updated, 'utf8');
    console.log('Generated and wrote:', Object.keys(replacements).join(', '));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

main();
