      uniform vec3      color;
      uniform sampler2D texture;

      varying float alpha;

      void main() {
        gl_FragColor = texture2D(texture, gl_PointCoord) * vec4(color, alpha) * 0.9;
      }
      