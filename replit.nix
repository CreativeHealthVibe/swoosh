{pkgs}: {
  deps = [
    pkgs.ffmpeg
    pkgs.postgresql
    pkgs.jq
    pkgs.giflib
    pkgs.libjpeg
    pkgs.cairo
    pkgs.pango
    pkgs.util-linux
    pkgs.imagemagick
  ];
}
