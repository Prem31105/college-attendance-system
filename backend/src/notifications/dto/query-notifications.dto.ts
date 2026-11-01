import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { NotificationPriority } from '@prisma/client';

export class QueryNotificationsDto {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsOptional()
  @IsString()
  type?: string;
}
