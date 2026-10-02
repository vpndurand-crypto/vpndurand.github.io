import s from './Skeleton.module.css';

export function Skeleton({ width = '100%', height = 16, lines = 1 }: { width?: string | number; height?: number; lines?: number }) {
  return (
    <div className={s.stack} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <div key={index} className={s.block} style={{ width: index === lines - 1 && lines > 1 ? '60%' : width, height }} />
      ))}
    </div>
  );
}
