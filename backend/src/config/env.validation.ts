import { Logger } from '@nestjs/common';

export interface EnvironmentValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateEnvironment(): EnvironmentValidationResult {
  const logger = new Logger('EnvironmentValidator');
  const errors: string[] = [];
  const nodeEnv = process.env.NODE_ENV || 'development';

  const requiredSecrets = [
    { key: 'JWT_ACCESS_SECRET', minLength: 32 },
    { key: 'JWT_REFRESH_SECRET', minLength: 32 },
    { key: 'QR_HMAC_SECRET', minLength: 32 },
  ];

  for (const { key, minLength } of requiredSecrets) {
    const value = process.env[key];
    if (!value) {
      errors.push(`Missing required environment variable: ${key}`);
    } else if (value.length < minLength) {
      errors.push(`Secret ${key} is too short (must be >= ${minLength} characters for cryptographic security)`);
    } else if (nodeEnv === 'production' && value.includes('dev_')) {
      errors.push(`Insecure development secret detected in production for ${key}. Production deployments must supply secure random 64-byte secrets.`);
    }
  }

  if (!process.env.DATABASE_URL) {
    errors.push('Missing required environment variable: DATABASE_URL');
  }

  if (errors.length > 0) {
    if (nodeEnv === 'production') {
      logger.error('CRITICAL: Environment validation failed in production mode:');
      errors.forEach((e) => logger.error(` - ${e}`));
      throw new Error(`Production environment validation failed: ${errors.join('; ')}`);
    } else {
      logger.warn('Environment validation notice (Development Mode):');
      errors.forEach((e) => logger.warn(` - ${e}`));
    }
    return { isValid: false, errors };
  }

  logger.log('✓ Environment and cryptographic secrets validated successfully.');
  return { isValid: true, errors: [] };
}
