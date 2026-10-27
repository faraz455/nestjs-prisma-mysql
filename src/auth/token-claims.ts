import { Profile } from './dto';

export const ACCESS_TOKEN_USE = 'access';
export const REFRESH_TOKEN_USE = 'refresh';

export type AccessTokenClaims = {
  sub: string;
  sid: string;
  tenant: string;
  tokenUse: typeof ACCESS_TOKEN_USE;
  profile: Profile;
};

export type RefreshTokenClaims = {
  sub: string;
  sid: string;
  tenant: string;
  tokenUse: typeof REFRESH_TOKEN_USE;
};
