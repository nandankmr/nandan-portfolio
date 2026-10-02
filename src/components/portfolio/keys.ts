// "React.js", "React" and "react" are the same tool across data lists.
export function toolKey(name: string) {
  return name.toLowerCase().replace(/\.js\b/g, '').replace(/[^a-z0-9]/g, '');
}
