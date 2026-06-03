import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('boardrooms')
@Controller('boardrooms')
export class BoardroomsController {}
