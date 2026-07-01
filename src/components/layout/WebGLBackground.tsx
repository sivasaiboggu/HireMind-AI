import React, { useEffect, useRef } from 'react';

export const WebGLBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) {
      console.warn("WebGL not supported in browser, no background shader will be loaded");
      return;
    }

    // Set canvas dimensions
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Vertex shader source
    const vsSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment shader source
    const fsSource = `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_time;

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        
        // Pointer reactive drift (parallax)
        vec2 mouseDrift = (u_mouse - vec2(0.5)) * 0.08;
        vec2 coord = uv + mouseDrift;
        
        // Slow breathing pulse
        float breathe = sin(u_time * 0.5) * 0.12 + 0.88;
        
        // Perspective coordinate mapping (horizon around 0.45)
        float horizonY = 0.45;
        float distToHorizon = coord.y - horizonY;
        
        // Only draw perspective grid below horizon
        float gridLine = 0.0;
        if (distToHorizon < 0.0) {
          float perspective = 1.0 / (abs(distToHorizon) + 0.02);
          
          float gridX = sin((coord.x - 0.5) * perspective * 35.0);
          float gridY = sin(perspective * 18.0 * breathe + u_time * 0.4);
          
          // Fine line lattice thickness
          float lineX = smoothstep(0.96, 0.99, abs(gridX));
          float lineY = smoothstep(0.96, 0.99, abs(gridY));
          gridLine = max(lineX, lineY);
          
          // Fade grid near horizon and borders
          float horizonFade = smoothstep(0.0, 0.35, abs(distToHorizon));
          gridLine *= horizonFade * 0.14;
        }
        
        // Violet/Coral gradient glow
        vec2 glowCenter = vec2(0.5) + mouseDrift * 0.4;
        float dist = length(uv - glowCenter);
        vec3 glowColor = mix(vec3(0.54, 0.36, 0.96), vec3(1.0, 0.42, 0.33), uv.y);
        float glowIntensity = exp(-dist * 2.0) * 0.08;
        
        // Base dark space color (#09090E)
        vec3 baseColor = vec3(0.035, 0.035, 0.055);
        vec3 finalColor = baseColor + glowColor * glowIntensity + glowColor * gridLine;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    // Helper: Compile shader
    const compileShader = (source: string, type: number): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(vsSource, gl.VERTEX_SHADER);
    const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    // Create & link program
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Look up uniforms and attributes
    const positionLoc = gl.getAttribLocation(program, 'position');
    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const mouseLoc = gl.getUniformLocation(program, 'u_mouse');
    const timeLoc = gl.getUniformLocation(program, 'u_time');

    // Create fullscreen quad buffer
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const vertices = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      gl.viewport(0, 0, width, height);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.tx = e.clientX / window.innerWidth;
      mouseRef.current.ty = 1.0 - (e.clientY / window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Render loop variables
    let animationId: number;
    let startTime = Date.now();

    const renderLoop = () => {
      const elapsedSeconds = (Date.now() - startTime) / 1000.0;
      
      // Interpolate mouse coordinates for smooth drift parallax
      const mouse = mouseRef.current;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      // Bind program and set uniforms
      gl.useProgram(program);
      gl.uniform2f(resolutionLoc, width, height);
      gl.uniform2f(mouseLoc, mouse.x, mouse.y);
      gl.uniform1f(timeLoc, elapsedSeconds);

      // Draw quad
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationId = requestAnimationFrame(renderLoop);
    };

    gl.viewport(0, 0, width, height);
    renderLoop();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      
      // Clean up buffers and program
      gl.deleteBuffer(buffer);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -2,
        pointerEvents: 'none',
        display: 'block',
        width: '100vw',
        height: '100vh'
      }}
    />
  );
};
