/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

interface BackgroundShaderProps {
  themeRgb: {
    base: [number, number, number];
    primary: [number, number, number];
    secondary: [number, number, number];
  };
}

export default function BackgroundShader({ themeRgb }: BackgroundShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const themeRgbRef = useRef(themeRgb);

  // Keep colors updated inside the loop without restarting it
  useEffect(() => {
    themeRgbRef.current = themeRgb;
  }, [themeRgb]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) {
      console.warn('WebGL is not supported in this environment.');
      return;
    }

    // Vertex Shader code
    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment Shader code
    const fsSource = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform vec3 u_color_base;
      uniform vec3 u_color_primary;
      uniform vec3 u_color_secondary;
      varying vec2 v_texCoord;

      void main() {
        vec2 uv = v_texCoord;
        float t = u_time * 0.15;
        
        // Flowing noise patterns
        float noise = sin(uv.x * 2.5 + t) * cos(uv.y * 2.0 - t * 0.4);
        noise += sin(uv.y * 4.0 + t * 0.6) * cos(uv.x * 3.0 + t * 0.9);
        noise += sin((uv.x + uv.y) * 1.5 + t * 0.3) * 0.5;
        
        // Normalize noise to 0..1 range
        float amplitude = clamp(noise * 0.4 + 0.5, 0.0, 1.0);
        
        // Add dynamic interactive mouse gradient
        float distToMouse = distance(uv, u_mouse);
        float mouseGlow = smoothstep(0.4, 0.0, distToMouse) * 0.15;

        // Formulate final visual blend
        vec3 col = mix(u_color_base, u_color_primary, amplitude * 0.4);
        col = mix(col, u_color_secondary, clamp(sin(t + uv.x * 1.5), 0.0, 1.0) * 0.25);
        col += vec3(mouseGlow) * u_color_primary;
        
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Unable to initialize the shader program:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Look up location of attributes and uniforms
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const uTimeLocation = gl.getUniformLocation(program, 'u_time');
    const uResolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const uMouseLocation = gl.getUniformLocation(program, 'u_mouse');
    const uColorBaseLocation = gl.getUniformLocation(program, 'u_color_base');
    const uColorPrimaryLocation = gl.getUniformLocation(program, 'u_color_primary');
    const uColorSecondaryLocation = gl.getUniformLocation(program, 'u_color_secondary');

    // Create custom quad geometry
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Mouse Tracking in normalized texture coordinate space
    let mouseCoordinates = { x: 0.5, y: 0.5 };
    let targetMouseCoordinates = { x: 0.5, y: 0.5 };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        targetMouseCoordinates.x = (event.clientX - rect.left) / rect.width;
        targetMouseCoordinates.y = 1.0 - (event.clientY - rect.top) / rect.height; // WebGL starts bottom-left
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        const rect = canvas.getBoundingClientRect();
        if (rect.width && rect.height) {
          targetMouseCoordinates.x = (touch.clientX - rect.left) / rect.width;
          targetMouseCoordinates.y = 1.0 - (touch.clientY - rect.top) / rect.height;
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    let animationId = 0;
    let startTime = performance.now();

    // Use ResizeObserver for responsive canvas scaling
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = Math.max(128, Math.floor(width));
        canvas.height = Math.max(128, Math.floor(height));
      }
    });
    resizeObserver.observe(canvas);

    const render = (now: number) => {
      if (!canvasRef.current) return;

      gl.viewport(0, 0, canvas.width, canvas.height);

      // Smooth interpolation for mouse position (saves frame stutter)
      mouseCoordinates.x += (targetMouseCoordinates.x - mouseCoordinates.x) * 0.08;
      mouseCoordinates.y += (targetMouseCoordinates.y - mouseCoordinates.y) * 0.08;

      const elapsedSeconds = (now - startTime) * 0.001;

      // Update uniforms
      if (uTimeLocation) gl.uniform1f(uTimeLocation, elapsedSeconds);
      if (uResolutionLocation) gl.uniform2f(uResolutionLocation, canvas.width, canvas.height);
      if (uMouseLocation) gl.uniform2f(uMouseLocation, mouseCoordinates.x, mouseCoordinates.y);

      // Pull from interactive refs to represent real-time changes
      const rgb = themeRgbRef.current;
      if (uColorBaseLocation) gl.uniform3fv(uColorBaseLocation, rgb.base);
      if (uColorPrimaryLocation) gl.uniform3fv(uColorPrimaryLocation, rgb.primary);
      if (uColorSecondaryLocation) gl.uniform3fv(uColorSecondaryLocation, rgb.secondary);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <canvas
      id="bg-shader-canvas"
      ref={canvasRef}
      className="absolute inset-0 w-full h-full -z-10 bg-neutral-950 block pointer-events-none"
    />
  );
}
