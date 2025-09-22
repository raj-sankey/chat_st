const iconFiles = import.meta.glob('./icons/*.{svg,png}', { eager: true });
const Icons = Object.fromEntries(
  Object.entries(iconFiles).map(([path, module]) => {
    const name = path.split('/').pop().split('.')[0];
    return [name, module.default];
  })
);

const imageFiles = import.meta.glob('./images/*.{jpg,png}', { eager: true });
const Images = Object.fromEntries(
  Object.entries(imageFiles).map(([path, module]) => {
    const name = path.split('/').pop().split('.')[0];
    return [name, module.default];
  })
);

export { Icons, Images };
