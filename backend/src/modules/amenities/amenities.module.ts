import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Amenity } from './entities/amenity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Amenity])],
  exports: [TypeOrmModule],
})
export class AmenitiesModule {}
