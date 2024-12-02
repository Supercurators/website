declare module 'url-regex-safe' {
  const urlRegex: (options?: { exact: boolean }) => RegExp;
  export default urlRegex;
} 