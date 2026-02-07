import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { AdvancesService } from './advances.service';
import { Advance } from './entities/advance.entity';

@Controller('advances')
export class AdvancesController {
  constructor(private readonly advancesService: AdvancesService) {}

  @Get()
  findAll() {
    return this.advancesService.findAll();
  }

  @Post()
  create(@Body() advance: Partial<Advance>) {
    return this.advancesService.create(advance);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: Partial<Advance>) {
    return this.advancesService.update(id, updateData);
  }
}
