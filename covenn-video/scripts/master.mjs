// Fichiers livrés du film : image du rendu Remotion ramenée en yuv420p (plage vidéo), son repris des WAV d'origine
// (pas de double compression), durée exacte 30,000 s, MP4 lisible partout (faststart).
//   out/covenn-hexa-v4-30s.mp4                — musique et design sonore
//   out/covenn-hexa-v4-30s-sans-musique.mp4   — design sonore seul (même niveau que dans la version complète)
// Usage : node scripts/master.mjs   (après npm run score, npm run score:sfx et npm run render:vision)
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const raw = join(root, 'out/covenn-hexa-vision-raw.mp4');
const versions = [
  { audio: 'public/audio/covenn-vision-score.wav', out: 'out/covenn-hexa-v4-30s.mp4' },
  { audio: 'public/audio/covenn-vision-sfx.wav', out: 'out/covenn-hexa-v4-30s-sans-musique.mp4' },
];

for (const v of versions) {
  const out = join(root, v.out);
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', raw, '-i', join(root, v.audio), '-map', '0:v:0', '-map', '1:a:0',
    '-vf', 'scale=in_range=full:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high', '-level:v', '4.1',
    '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-ac', '2', '-t', '30', '-movflags', '+faststart', out,
  ], { stdio: 'inherit' });
  const probe = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height,pix_fmt,r_frame_rate,nb_frames,sample_rate,channels,duration', '-show_entries', 'format=duration,size', '-of', 'compact', out], { encoding: 'utf8' });
  console.log(`${v.out}\n${probe.trim()}`);
}
