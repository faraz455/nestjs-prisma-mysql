import { SetMetadata } from '@nestjs/common';

type Operator = 'OR' | 'AND';

export type RolesObject = {
  [key in Operator]?: Array<RolesObject | string>;
};

function andParser(arr: RolesObject['AND'], userRoles: string[]) {
  let perm = true;
  if (arr.length === 0) return true;
  for (const item of arr!) {
    if (typeof item === 'string') {
      if (!(!!userRoles && userRoles.includes(item))) {
        perm = false;
        break;
      }
    } else {
      perm = checkRoles(item, userRoles);
      if (!perm) break;
    }
  }

  return perm;
}

function orParser(arr: RolesObject['OR'], userRoles: string[]) {
  if (arr.length === 0) return true;

  let perm = false;

  for (const item of arr!) {
    if (typeof item === 'string') {
      if (!!userRoles && userRoles.includes(item)) {
        perm = true;
        break;
      }
    } else {
      perm = checkRoles(item, userRoles);
      if (perm) break;
    }
  }

  return perm;
}

export function checkRoles(roles: RolesObject, userRole: string[]): boolean {
  const andResult: boolean = roles.AND ? andParser(roles.AND, userRole) : true;

  const orResult: boolean = roles.OR ? orParser(roles.OR, userRole) : true;

  return andResult && orResult;
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RolesObject[]) => SetMetadata(ROLES_KEY, roles);
