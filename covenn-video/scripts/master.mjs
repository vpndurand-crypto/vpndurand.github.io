// Fichier livré du film « vision » : image du rendu Remotion ramenée en yuv420p (plage vidéo), son repris du WAV d'origine
// (pas de double compression), durée exacte 30,000 s, MP4 lisible partout (faststart).
// Usage : node scripts/master.mjs   (après npm run render:vision)
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const raw = join(root, 'out/covenn-hexa-vision-raw.mp4');
const audio = join(root, 'public/audio/covenn-vision-score.wav');
const out = join(root, 'out/covenn-hexa-vision-30s.mp4');

execFileSync('ffmpeg', [
  '-hide_banner', '-loglevel', 'error', '-y', '-i', raw, '-i', audio, '-map', '0:v:0', '-map', '1:a:0',
  '-vf', 'scale=in_range=full:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high', '-level:v', '4.1',
  '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
  '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-ac', '2', '-t', '30', '-movflags', '+faststart', out,
], { stdio: 'inherit' });

const probe = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height,pix_fmt,r_frame_rate,nb_frames,sample_rate,channels,duration', '-show_entries', 'format=duration,size', '-of', 'compact', out], { encoding: 'utf8' });
console.log(probe.trim());
