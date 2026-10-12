'use client';

import { useEffect, useRef } from 'react';

// Графитовые поля: переливы стрейч-плёнки (тонкоплёночная интерференция), медленно текут, тянутся за курсором.
// Чистый WebGL, полноэкранный треугольник, половинное разрешение, пауза вне экрана и во фоне вкладки.
const FRAG = `
precision mediump float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uScroll;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv * vec2(uRes.x/uRes.y, 1.);
  float t = uTime * .06;
  // складки плёнки: диагональные полосы, искажённые шумом
  float warp = fbm(p*1.6 + vec2(t, -t*.7) + uMouse*.25);
  float v = p.x*.9 + p.y*.55 + warp*1.15 + uScroll*.35;
  float band = sin(v*7. - uTime*.35);
  float sheen = smoothstep(.55, 1., band) * (.55 + .45*fbm(p*3. - t));
  // радужная кромка тонкой плёнки, смещённая к фирменному лайму
  vec3 film = .5 + .5*cos(6.2831*(v*.35 + vec3(.0, .33, .67)));
  film = mix(film, vec3(.745, .918, .122), .45);
  vec3 base = vec3(.118, .129, .153);
  float vign = smoothstep(1.25, .25, length(uv - .5));
  vec3 col = base + film * sheen * .13 * vign;
  col += (hash(gl_FragCoord.xy + uTime) - .5) * .018; // зерно против бандинга
  gl_FragColor = vec4(col, 1.);
}`;

export function FilmShader({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return;
    const compile = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }'));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, 'uRes'), uTime = gl.getUniformLocation(prog, 'uTime');
    const uMouse = gl.getUniformLocation(prog, 'uMouse'), uScroll = gl.getUniformLocation(prog, 'uScroll');

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let visible = false, raf = 0, last = performance.now(), time = 0;

    const resize = () => {
      const scale = Math.min(devicePixelRatio || 1, 2) * 0.5; // половинное разрешение: фон мягкий, GPU отдыхает
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * scale));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      gl.uniform1f(uTime, time);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uScroll, -rect.top / Math.max(1, innerHeight));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt;
      const k = 1 - Math.pow(0.02, dt);
      mouse.x += (mouse.tx - mouse.x) * k;
      mouse.y += (mouse.ty - mouse.y) * k;
      draw();
      raf = requestAnimationFrame(loop);
    };
    const start = () => { if (!raf && !reduced) { last = performance.now(); raf = requestAnimationFrame(loop); } };

    const ro = new ResizeObserver(() => { resize(); draw(); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }, { rootMargin: '100px' });
    io.observe(canvas);
    const onMove = (e: PointerEvent) => { mouse.tx = e.clientX / innerWidth - 0.5; mouse.ty = 0.5 - e.clientY / innerHeight; };
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) addEventListener('pointermove', onMove, { passive: true });
    const onVis = () => { if (!document.hidden) start(); };
    document.addEventListener('visibilitychange', onVis);
    resize();
    draw(); // статичный кадр сразу (и единственный при reduced motion)

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-0 -z-10 h-full w-full ${className}`} />;
}
