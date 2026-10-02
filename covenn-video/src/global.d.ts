// Déclarations des imports non TypeScript (styles en modules CSS et polices de la bêta).
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}
declare module '*.css';
declare module '*.woff2' {
  const url: string;
  export default url;
}
