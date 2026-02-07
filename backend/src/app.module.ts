import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { Advance } from './advances/entities/advance.entity';
import { Expense } from './expenses/entities/expense.entity';
import { Project } from './projects/entities/project.entity';
import { UsersModule } from './users/users.module';
import { AdvancesModule } from './advances/advances.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'postgres',
      port: 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'petrotec123',
      database: process.env.DB_NAME || 'petrotec_expense_db',
      entities: [User, Advance, Expense, Project],
      synchronize: true,
    }),
    UsersModule,
    AdvancesModule,
    ExpensesModule,
    ProjectsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
