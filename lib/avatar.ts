export function dicebearUrl(seed: number | string): string {
  return `https://api.dicebear.com/9.x/lorelei/png?seed=${seed}&size=85`;
}

export function resolveAvatar(avatar: string | null | undefined, fallbackSeed: number | string): string {
  return avatar || dicebearUrl(fallbackSeed);
}
