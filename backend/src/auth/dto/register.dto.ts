import { IsEmail, IsNotEmpty, IsString, MinLength, Matches, IsOptional, IsEnum } from 'class-validator';
import { OsType } from '@prisma/client';

export class RegisterStudentDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Matches(/^[a-zA-Z0-9._%+-]+@college\.edu$/, {
    message: 'Institutional email must belong to the @college.edu domain',
  })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Roll number is required' })
  @Matches(/^[A-Z]{2,4}[0-9]{4}-[0-9]{3,4}$/, {
    message: 'Roll number must match format CS2026-001',
  })
  rollNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'Registration number is required' })
  @Matches(/^[0-9]{8,16}$/, {
    message: 'Registration number must be 8 to 16 digits',
  })
  registrationNumber: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Device public key PEM is required' })
  publicKeyPem: string;

  @IsString()
  @IsOptional()
  deviceFingerprint?: string;

  @IsString()
  @IsOptional()
  deviceModel?: string;

  @IsEnum(OsType)
  @IsOptional()
  osType?: OsType;

  @IsString()
  @IsOptional()
  osVersion?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;
}
