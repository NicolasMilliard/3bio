const MAX_TILT_X = 3.5;
const MAX_TILT_Y = 4.5;

type HeroTilt = {
  rotateX: number;
  rotateY: number;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

export const calculateHeroTilt = (
  pointerX: number,
  pointerY: number,
  width: number,
  height: number,
): HeroTilt => {
  if (width <= 0 || height <= 0) {
    return {
      rotateX: 0,
      rotateY: 0,
    };
  }

  const normalizedX = clamp(pointerX / width, 0, 1);
  const normalizedY = clamp(pointerY / height, 0, 1);

  return {
    rotateX: (0.5 - normalizedY) * MAX_TILT_X * 2,
    rotateY: (normalizedX - 0.5) * MAX_TILT_Y * 2,
  };
};
