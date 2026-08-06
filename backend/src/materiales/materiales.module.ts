import { Module } from '@nestjs/common';
import { MaterialesController } from './materiales.controller';
import { MaterialesService } from './materiales.service';

@Module({
  controllers: [MaterialesController],
  providers: [MaterialesService]
})
export class MaterialesModule {}
