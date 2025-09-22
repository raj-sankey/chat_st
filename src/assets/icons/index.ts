// src/assets/icons/index.ts
const iconFiles = import.meta.glob("./*.svg", { eager: true });

const Icons: Record<string, string> = {};

Object.entries(iconFiles).forEach(([path, module]) => {
  const name = path.split("/").pop()?.replace(".svg", "") || "";
  // @ts-ignore
  Icons[name] = module.default;
});

export default Icons;

// ✅ this will give you union of keys like "Search" | "User"
export type IconName = keyof typeof Icons;
