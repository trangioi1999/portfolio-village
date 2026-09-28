import { Color, DoubleSide, ShaderMaterial, Texture } from 'three';

/** Stylised animated water (ripples + soft highlights). */
export function waterMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new Color('#2e8fb3') },
      uShallow: { value: new Color('#7fd6ea') },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uDeep;
      uniform vec3 uShallow;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv * 9.0;
        float w = sin(p.x * 1.3 + uTime * 1.1) + sin(p.y * 1.7 - uTime * 0.8) + sin((p.x + p.y) * 0.9 + uTime * 0.6);
        float highlight = smoothstep(1.7, 2.6, w);
        float d = length(vUv - 0.5) * 2.0;
        vec3 color = mix(uDeep, uShallow, smoothstep(0.1, 1.0, d));
        color += highlight * 0.28;
        gl_FragColor = vec4(color, 0.93);
        #include <colorspace_fragment>
      }
    `,
  });
}

/** Falling water — scrolling streak texture that fades out at the bottom. */
export function waterfallMaterial(streaks: Texture): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uMap: { value: streaks },
      uSpeed: { value: 0.55 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uSpeed;
      uniform sampler2D uMap;
      varying vec2 vUv;
      void main() {
        vec4 tex = texture2D(uMap, vec2(vUv.x * 1.5, vUv.y * 2.0 + uTime * uSpeed));
        float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
        float fade = smoothstep(0.0, 0.55, vUv.y);
        vec3 color = mix(vec3(0.55, 0.85, 0.95), vec3(1.0), tex.r * 0.6);
        gl_FragColor = vec4(color, 0.88 * edge * fade);
        #include <colorspace_fragment>
      }
    `,
  });
}
