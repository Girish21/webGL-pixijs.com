uniform float uTime;
uniform sampler2D uTexture;
uniform sampler2D uMask;

varying vec2 vUv;
varying float vNoise;

void main() {
  vec4 maskColor = texture2D(uMask, vUv);

  float strength = maskColor.a * maskColor.r;
  strength *= 6.;
  strength = min(1., strength);

  vec4 color = texture2D(uTexture, vUv + (1. - strength) * .1);

  gl_FragColor = color * strength;
}
