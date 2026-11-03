import { IsNotEmpty, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class CreateDisputeDto {
  @IsString()
  @IsNotEmpty({ message: 'sessionId is required' })
  sessionId!: string;

  @IsString()
  @IsOptional()
  attendanceRecordId?: string;

  @IsString()
  @IsNotEmpty({ message: 'Dispute reason is required' })
  @Length(5, 1000, { message: 'Reason must be between 5 and 1000 characters' })
  reason!: string;
}

export class SendDisputeMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'Message text is required' })
  @Length(1, 2000, { message: 'Message must be between 1 and 2000 characters' })
  message!: string;
}

export class ResolveDisputeDto {
  @IsString()
  @IsOptional()
  resolutionNote?: string;
}

export class RejectDisputeDto {
  @IsString()
  @IsNotEmpty({ message: 'Rejection reason is mandatory' })
  @MinLength(5, { message: 'Rejection reason must be at least 5 characters' })
  rejectionReason!: string;
}
