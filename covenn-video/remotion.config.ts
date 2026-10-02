import { Config } from '@remotion/cli/config';

// Rendu déterministe image par image, 1920 × 1080, 30 i/s, H.264.
// Le navigateur sans interface préinstallé évite tout téléchargement au moment du rendu.
Config.setBrowserExecutable('/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');
Config.setConcurrency(4);
Config.setOverwriteOutput(true);
