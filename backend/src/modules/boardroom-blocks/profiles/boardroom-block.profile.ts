import { Injectable, Inject } from '@nestjs/common';
import { AutomapperProfile } from '@automapper/nestjs';
import { mapFrom } from '@automapper/core';
import { Mapper, MappingProfile } from '@automapper/core';
import { BoardroomBlock } from '../entities/boardroom-block.entity';
import { BlockBoardroomDto, BlockUserDto, BoardroomBlockResponseDto } from '../dto/boardroom-block-response.dto';

@Injectable()
export class BoardroomBlockProfile extends AutomapperProfile {
  constructor(@Inject('automapper:nestjs:default') mapper: any) {
    super(mapper as Mapper);
  }

  mapProfile(): MappingProfile {
    return (mapper) => {
      mapper
        .createMap(BoardroomBlock, BoardroomBlockResponseDto)
        .forMember(
          (d) => d.boardroom,
          mapFrom((s) =>
            s.boardroom
              ? Object.assign(new BlockBoardroomDto(), { id: s.boardroom.id, name: s.boardroom.name })
              : null,
          ),
        )
        .forMember(
          (d) => d.createdBy,
          mapFrom((s) =>
            s.createdBy
              ? Object.assign(new BlockUserDto(), {
                  id: s.createdBy.id,
                  firstName: s.createdBy.firstName,
                  lastName: s.createdBy.lastName,
                })
              : null,
          ),
        );
    };
  }
}
