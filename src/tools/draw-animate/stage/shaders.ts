export const CHARACTER_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uAmp;
  uniform int uMove;
  uniform float uBeat;
  uniform vec2 uSize;
  uniform int uPinCount;
  uniform vec2 uPins[4];

  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;

    float t = uTime * uSpeed;
    // uv.y is 0 at feet and 1 at top
    float h = clamp(uv.y, 0.0, 1.0);
    float normX = (uv.x - 0.5) * 2.0;

    float pinMul = 1.0;
    if (uPinCount > 0) {
      float maxW = 0.0;
      float sigmaSq = 0.0484; // 0.22^2
      for (int i = 0; i < 4; i++) {
        if (i < uPinCount) {
          vec2 d = uv - uPins[i];
          float w = exp(-dot(d, d) / sigmaSq);
          maxW = max(maxW, w);
        }
      }
      pinMul = 0.35 + maxW;
    }

    float amp = uAmp * pinMul;

    if (uMove == 0) {
      // Wiggle: jelly sway anchored at feet
      pos.x += sin(t * 4.0 + h * 3.0) * 0.04 * h * uSize.y * amp;
    } else if (uMove == 1) {
      // Bounce: subtle volume-preserving vertex squash/stretch
      float squash = sin(t * 6.0) * 0.03 * amp;
      pos.y *= 1.0 + squash * h;
      pos.x *= 1.0 - squash * 0.5 * h;
    } else if (uMove == 2) {
      // Walk: upper-half sway
      float upper = smoothstep(0.35, 1.0, h);
      pos.x += sin(t * 6.0) * 0.035 * upper * uSize.x * amp;
    } else if (uMove == 3) {
      // Fly: wing-flap feel on left/right edges
      float edgeWeight = smoothstep(0.15, 1.0, abs(normX));
      pos.y += sin(t * 10.0) * 0.035 * edgeWeight * uSize.y * amp;
      pos.x += sin(t * 10.0) * 0.02 * edgeWeight * sign(normX) * uSize.x * amp;
    } else if (uMove == 4) {
      // Swim: traveling wave along x
      float tailWeight = clamp(1.0 - uv.x, 0.0, 1.0);
      pos.y += sin(t * 5.0 + normX * 4.0) * 0.05 * (0.3 + 0.7 * tailWeight) * uSize.y * amp;
    } else if (uMove == 5) {
      // Dance: groovy sway + beat pop
      pos.x += sin(t * 6.0 + h * 4.0) * 0.05 * h * uSize.y * amp;
      pos.y += uBeat * 0.025 * h * uSize.y * pinMul;
    }

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const CHARACTER_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uMap;
  varying vec2 vUv;

  void main() {
    vec4 tex = texture2D(uMap, vUv);
    if (tex.a < 0.02) discard;
    gl_FragColor = tex;
  }
`;
