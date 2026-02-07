import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expensesRepository: Repository<Expense>,
  ) {}

  findAll(): Promise<Expense[]> {
    return this.expensesRepository.find({ relations: ['user', 'advance'] });
  }

  create(expense: Partial<Expense>): Promise<Expense> {
    const newExpense = this.expensesRepository.create(expense);
    return this.expensesRepository.save(newExpense);
  }

  async update(id: string, updateData: Partial<Expense>): Promise<Expense> {
    await this.expensesRepository.update(id, updateData);
    return this.expensesRepository.findOneBy({ id });
  }
}
