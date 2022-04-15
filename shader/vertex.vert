uniform float uTime;
uniform vec2 uMouse;

varying vec2 vUv;
varying float vNoise;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);

  vUv = uv;
}
