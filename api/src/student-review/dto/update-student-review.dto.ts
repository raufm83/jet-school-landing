import { PartialType } from '@nestjs/swagger';
import { CreateStudentReviewDto } from './create-student-review.dto';

export class UpdateStudentReviewDto extends PartialType(CreateStudentReviewDto) {}
