import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { Expense } from './entities/expense.entity';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  findAll() {
    return this.expensesService.findAll();
  }

  @Post()
  create(@Body() expense: Partial<Expense>) {
    return this.expensesService.create(expense);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: Partial<Expense>) {
    return this.expensesService.update(id, updateData);
  }
}
