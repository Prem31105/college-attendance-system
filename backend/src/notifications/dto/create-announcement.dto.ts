import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, MinLength } from 'class-validator';
import { Role, NotificationPriority } from '@prisma/client';

export enum AnnouncementTarget {
  ALL = 'ALL',
  ROLE = 'ROLE',
  CLASS = 'CLASS',
  INDIVIDUAL = 'INDIVIDUAL',
}

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  message: string;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority = NotificationPriority.NORMAL;

  @IsEnum(AnnouncementTarget)
  target: AnnouncementTarget;

  @IsEnum(Role)
  @IsOptional()
  targetRole?: Role;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  targetUserIds?: string[];

  @IsString()
  @IsOptional()
  classSectionId?: string;

  @IsString()
  @IsOptional()
  type?: string = 'CAMPUS_BROADCAST';

  @IsOptional()
  data?: any;
}
