export interface BlockBoardroomRef {
  id: string;
  name: string;
}

export interface BoardroomBlock {
  id: string;
  boardroom: BlockBoardroomRef;
  boardroomId: string;
  startTime: string;
  endTime: string;
  reason: string;
  isActive: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BoardroomBlockCreateRequest {
  boardroomId: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface BoardroomBlockUpdateRequest {
  startTime?: string;
  endTime?: string;
  reason?: string;
}
