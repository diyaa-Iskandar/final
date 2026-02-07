import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvancesService } from './advances.service';
import { AdvancesController } from './advances.controller';
import { Advance } from './entities/advance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Advance])],
  providers: [AdvancesService],
  controllers: [AdvancesController],
})
export class AdvancesModule {}
