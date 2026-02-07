import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Advance } from './entities/advance.entity';

@Injectable()
export class AdvancesService {
  constructor(
    @InjectRepository(Advance)
    private advancesRepository: Repository<Advance>,
  ) {}

  findAll(): Promise<Advance[]> {
    return this.advancesRepository.find({ relations: ['user'] });
  }

  create(advance: Partial<Advance>): Promise<Advance> {
    // تعيين المبلغ المتبقي ليساوي المبلغ الأصلي عند الإنشاء
    advance.remainingAmount = advance.amount;
    const newAdvance = this.advancesRepository.create(advance);
    return this.advancesRepository.save(newAdvance);
  }

  async update(id: string, updateData: Partial<Advance>): Promise<Advance> {
    await this.advancesRepository.update(id, updateData);
    return this.advancesRepository.findOneBy({ id });
  }
}
