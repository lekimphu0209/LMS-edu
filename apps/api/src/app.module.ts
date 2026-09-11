import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClassesModule } from './modules/classes/classes.module';
import { CurriculumModule } from './modules/curriculum/curriculum.module';
import { QuestionBankModule } from './modules/question-bank/question-bank.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { ProgressModule } from './modules/progress/progress.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { StudentsModule } from './modules/students/students.module';
import { AdminModule } from './modules/admin/admin.module';
import { StorageModule } from './common/storage/storage.module';
import { EmailModule } from './common/email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ClassesModule,
    CurriculumModule,
    QuestionBankModule,
    AssignmentsModule,
    SubmissionsModule,
    ProgressModule,
    FeedbackModule,
    StatisticsModule,
    StudentsModule,
    AdminModule,
    StorageModule,
    EmailModule,
  ],
})
export class AppModule {}
