/** `GET /wp/v2/users/me` (edit context) — fields we use in the app */
export interface WpUserMeResponse {
  id: number;
  name: string;
  slug: string;
  email?: string;
}

export interface WpJwtTokenResponse {
  token?: string;
  /** Some plugins nest the token */
  data?: { token?: string };
  message?: string;
  code?: string;
}
