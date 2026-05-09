import { useEffect, useRef } from "react";

const VERT = `
  attribute vec2 a_pos;
  void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

// Four soft Gaussian blobs that drift with time and shift with mouse position.
// Each blob is a weighted colour; they blend over a near-black base.
const FRAG = `
  precision mediump float;
  uniform vec2  u_res;
  uniform vec2  u_mouse;
  uniform float u_time;

  void main() {
    vec2  uv  = gl_FragCoord.xy / u_res;
    float asp = u_res.x / u_res.y;
    vec2  p   = vec2(uv.x * asp, uv.y);
    float t   = u_time * 0.32;

    // Mouse offset from centre, aspect-corrected
    vec2 m = vec2((u_mouse.x - 0.5) * asp, u_mouse.y - 0.5);

    // Blob positions: static anchor + slow drift + mouse parallax
    vec2 b1 = vec2((0.25 + sin(t*0.71)*0.09 + m.x*0.20) * asp,
                    0.30 + cos(t*0.53)*0.07 + m.y*0.15);
    vec2 b2 = vec2((0.75 + cos(t*0.67)*0.08 - m.x*0.15) * asp,
                    0.62 + sin(t*0.59)*0.08 - m.y*0.12);
    vec2 b3 = vec2((0.50 + sin(t*0.43)*0.06 + m.x*0.05) * asp,
                    0.80 + cos(t*0.37)*0.05 + m.y*0.08);
    vec2 b4 = vec2((0.85 + cos(t*0.89)*0.04 + m.x*0.10) * asp,
                    0.18 + sin(t*0.47)*0.06 - m.y*0.08);

    // Gaussian falloff — lower multiplier = wider, more visible blob
    float w1 = exp(-length(p - b1) * 1.6);
    float w2 = exp(-length(p - b2) * 1.5);
    float w3 = exp(-length(p - b3) * 2.0);
    float w4 = exp(-length(p - b4) * 2.8);

    // OnePDF brand palette
    vec3 bg = vec3(0.024, 0.024, 0.033);   // #060609 near-black
    vec3 c1 = vec3(0.298, 0.545, 0.961);   // #4c8bf5 brand blue
    vec3 c2 = vec3(0.227, 0.482, 0.910);   // #3a7be8 deeper blue
    vec3 c3 = vec3(0.350, 0.170, 0.750);   // #5929BF purple accent
    vec3 c4 = vec3(0.090, 0.340, 0.820);   // #1757D1 indigo

    vec3 color = bg + (c1*w1 + c2*w2 + c3*w3 + c4*w4) * 0.75;

    // Light vignette — just enough to ground the edges
    float vig = 1.0 - smoothstep(0.5, 1.6, length(vec2(uv.x - 0.5, (uv.y - 0.5) * 0.8)));
    color *= mix(0.72, 1.0, vig);

    gl_FragColor = vec4(color, 1.0);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  return shader;
}

export function LandingWebGLBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Full-screen triangle strip
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes   = gl.getUniformLocation(prog, "u_res");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uTime  = gl.getUniformLocation(prog, "u_time");

    // Mouse position with lerp smoothing
    const mouse  = { x: 0.5, y: 0.5 };
    const target = { x: 0.5, y: 0.5 };

    function onMouseMove(e: MouseEvent) {
      const r = canvas!.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width;
      target.y = 1.0 - (e.clientY - r.top) / r.height; // flip Y for WebGL
    }
    window.addEventListener("mousemove", onMouseMove);

    function resize() {
      canvas!.width  = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const start = performance.now();
    let raf: number;

    function render() {
      // Ease mouse toward cursor (lerp factor 0.06 = fluid, not instant)
      mouse.x += (target.x - mouse.x) * 0.06;
      mouse.y += (target.y - mouse.y) * 0.06;

      gl!.uniform2f(uRes,   canvas!.width, canvas!.height);
      gl!.uniform2f(uMouse, mouse.x, mouse.y);
      gl!.uniform1f(uTime,  (performance.now() - start) / 1000);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);

      raf = requestAnimationFrame(render);
    }
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouseMove);
      ro.disconnect();
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        display: "block",
      }}
    />
  );
}
