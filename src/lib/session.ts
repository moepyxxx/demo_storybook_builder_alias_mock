export function getLocalStorageItem(
  key: string
): { hoge: string; fuga: number } | null {
  const item = localStorage.getItem(key);
  return item ? (JSON.parse(item) as { hoge: string; fuga: number }) : null;
}

export function setLocalStorageItem(
  key: string,
  value: { hoge: string; fuga: number }
): void {
  localStorage.setItem(key, JSON.stringify(value));
}
