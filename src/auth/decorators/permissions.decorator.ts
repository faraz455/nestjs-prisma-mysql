import { SetMetadata } from '@nestjs/common';
import { ResoucePermissionType, ResourceName } from '../dto';
import { PermissionType } from 'src/common/common.types';

export type PermissionNeeded = `${ResourceName}.${PermissionType}`;

export function splitPermissionNeeded(
  permissionNeeded: PermissionNeeded,
): [ResourceName, PermissionType] {
  return permissionNeeded.split('.') as [ResourceName, PermissionType];
}

type Operator = 'OR' | 'AND';

export type PermsObject = {
  [key in Operator]?: Array<PermsObject | PermissionNeeded>;
};

function andParser(
  arr: PermsObject['AND'],
  rolePermissions: ResoucePermissionType,
) {
  let perm = true;
  if (arr.length === 0) return true;
  for (const item of arr!) {
    if (typeof item === 'string') {
      item;
      const [resource, permission] = splitPermissionNeeded(item);
      if (
        !(
          !!rolePermissions &&
          rolePermissions[resource] &&
          rolePermissions[resource]![permission]
        )
      ) {
        perm = false;
        break;
      }
    } else {
      item;
      perm = checkPermission(item, rolePermissions);
      if (!perm) break;
    }
  }

  return perm;
}

function orParser(
  arr: PermsObject['OR'],
  rolePermissions: ResoucePermissionType,
) {
  if (arr.length === 0) return true;

  let perm = false;

  for (const item of arr!) {
    if (typeof item === 'string') {
      item;
      const [resource, permission] = splitPermissionNeeded(item);
      if (
        !!rolePermissions &&
        rolePermissions[resource] &&
        rolePermissions[resource]![permission]
      ) {
        perm = true;
        break;
      }
    } else {
      item;
      perm = checkPermission(item, rolePermissions);
      if (perm) break;
    }
  }

  return perm;
}

export function checkPermission(
  permissions: PermsObject,
  rolePermissions: ResoucePermissionType,
): boolean {
  const andResult: boolean = permissions.AND
    ? andParser(permissions.AND, rolePermissions)
    : true;

  const orResult: boolean = permissions.OR
    ? orParser(permissions.OR, rolePermissions)
    : true;

  return andResult && orResult;
}

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: PermsObject[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
