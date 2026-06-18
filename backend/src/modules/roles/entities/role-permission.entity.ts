import { Entity, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Role } from './role.entity';
import { Permission } from '../../permissions/entities/permission.entity';

@Entity({ name: 'role_permissions' })
export class RolePermission {
  @PrimaryColumn({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @PrimaryColumn({ name: 'permission_id', type: 'uuid' })
  permissionId: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;

  @CreateDateColumn()
  createdAt: Date;
}
