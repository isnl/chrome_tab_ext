import { onBeforeUnmount, ref } from "vue";

export interface SparkBurst {
  id: number;
  x: number;
  y: number;
  particles: SparkParticle[];
}

export interface SparkParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  rotate: string;
}

const SPARK_COLORS = [
  "#14b8a6", "#6366f1", "#f59e0b", "#22c55e", "#ec4899",
  "#0ea5e9", "#f97316", "#a855f7", "#06b6d4", "#84cc16", "#f43f5e"
];

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function generateParticles(count = 14): SparkParticle[] {
  const particles: SparkParticle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + randomBetween(-0.3, 0.3);
    const distance = randomBetween(28, 52);
    particles.push({
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size: randomBetween(3, 7),
      color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
      delay: randomBetween(0, 50),
      rotate: `${Math.floor(randomBetween(0, 360))}deg`
    });
  }
  return particles;
}

export function useSparkBurst() {
  const sparkBursts = ref<SparkBurst[]>([]);
  let sparkId = 0;
  const sparkTimers: number[] = [];

  function triggerSparkBurst(x: number, y: number) {
    const id = ++sparkId;
    const particles = generateParticles();
    sparkBursts.value = [...sparkBursts.value.slice(-4), { id, x, y, particles }];
    const timer = window.setTimeout(() => {
      sparkBursts.value = sparkBursts.value.filter((burst) => burst.id !== id);
    }, 820);
    sparkTimers.push(timer);
  }

  function triggerSparkBurstFromElement(element: Element | null, xRatio = 0.5, yRatio = 0.5) {
    const rect = element?.getBoundingClientRect();
    if (!rect) return;
    triggerSparkBurst(rect.left + rect.width * xRatio, rect.top + rect.height * yRatio);
  }

  onBeforeUnmount(() => {
    sparkTimers.forEach((timer) => window.clearTimeout(timer));
  });

  return { sparkBursts, triggerSparkBurst, triggerSparkBurstFromElement };
}
