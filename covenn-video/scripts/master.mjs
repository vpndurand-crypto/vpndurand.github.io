// Fichiers livrés du film V5 : image du rendu Remotion (images PNG, rendu quasi sans perte) ramenée en yuv420p (plage vidéo),
// son repris des WAV d'origine (pas de double compression), durée exacte 30,000 s, MP4 lisible partout (faststart).
//   out/Covenn_Hexa_V5_English_30s.mp4              — musique et design sonore
//   out/Covenn_Hexa_V5_English_30s_no-music.mp4     — design sonore seul (même niveau que dans la version complète)
// Usage : node scripts/master.mjs   (après npm run score, npm run score:sfx et npm run render:v5)
//         node scripts/master.mjs --film capos   → film Capital OS (après npm run score:capos, score:capos:sfx et render:capos) :
//   out/Covenn_Hexa_V5_CapitalOS_English_30s.mp4 et out/Covenn_Hexa_V5_CapitalOS_English_30s_no-music.mp4
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILMS = {
  hexa: {
    raw: 'out/covenn-hexa-v5-raw.mp4',
    versions: [
      { audio: 'public/audio/covenn-vision-score.wav', out: 'out/Covenn_Hexa_V5_English_30s.mp4' },
      { audio: 'public/audio/covenn-vision-sfx.wav', out: 'out/Covenn_Hexa_V5_English_30s_no-music.mp4' },
    ],
  },
  capos: {
    raw: 'out/covenn-capos-raw.mp4',
    versions: [
      { audio: 'public/audio/capos-score.wav', out: 'out/Covenn_Hexa_V5_CapitalOS_English_30s.mp4' },
      { audio: 'public/audio/capos-sfx.wav', out: 'out/Covenn_Hexa_V5_CapitalOS_English_30s_no-music.mp4' },
    ],
  },
};
const filmIndex = process.argv.indexOf('--film');
const film = FILMS[filmIndex >= 0 ? process.argv[filmIndex + 1] : 'hexa'];
if (!film) throw new Error(`Film inconnu : ${process.argv[filmIndex + 1]} (attendu : ${Object.keys(FILMS).join(', ')})`);
const raw = join(root, film.raw);
const versions = film.versions;

for (const v of versions) {
  const out = join(root, v.out);
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', raw, '-i', join(root, v.audio), '-map', '0:v:0', '-map', '1:a:0',
    // Le rendu Remotion à partir d'images PNG est en plage vidéo, matrice BT.601 : conversion explicite (filtre colorspace,
    // précis au niveau près) vers BT.709, la norme HD que les lecteurs appliquent ; sans elle, l'indigo et l'orange dérivent.
    '-vf', 'colorspace=ispace=bt470bg:iprimaries=bt709:itrc=bt709:irange=tv:space=bt709:primaries=bt709:trc=bt709:range=tv:format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-profile:v', 'high', '-level:v', '4.1',
    '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-ac', '2', '-t', '30', '-movflags', '+faststart', out,
  ], { stdio: 'inherit' });
  const probe = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height,pix_fmt,r_frame_rate,nb_frames,sample_rate,channels,duration', '-show_entries', 'format=duration,size', '-of', 'compact', out], { encoding: 'utf8' });
  console.log(`${v.out}\n${probe.trim()}`);
}
