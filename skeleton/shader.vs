      uniform float time;
      uniform float size;

      attribute float lifetime;
      attribute float shift;

      varying float alpha;

      void main() {
        float t = fract(time / lifetime + shift);
        float c = pow(t, 1.7) * 10.0;
        float s = ceil(c);
        float y = (1.0 - pow((s-c) * 2.0 - 1.0, 2.0)) / (s * s);

        alpha = 1.0 - smoothstep(0.8, 1.0, t);

        vec3 p = position * vec3(t, y, t);
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (size * (256.0 / length( mvPosition.xyz)) *
          (1.0 + smoothstep(0.8, 1.0, t) * 6.0));
        gl_Position = projectionMatrix * mvPosition;
      }