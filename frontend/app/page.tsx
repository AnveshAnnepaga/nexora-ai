"use client"

import React, { useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { SignInButton, useAuth } from '@clerk/nextjs'

export default function Home() {
  const { isLoaded, userId } = useAuth();

  useEffect(() => {
    // WebGL Shader Animation Background
    const canvas = document.getElementById('shader-canvas-ANIMATION_2') as HTMLCanvasElement;
    if (canvas) {
      function syncSize() {
        const w = canvas.clientWidth || 1280;
        const h = canvas.clientHeight || 720;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
      }
      if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(syncSize).observe(canvas);
      }
      syncSize();

      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;
        const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x / u_resolution.y;
    
    vec3 color = vec3(0.004, 0.043, 0.094);
    
    vec2 st = uv * 3.0;
    st.y += u_time * 0.05;
    vec2 ipos = floor(st);
    vec2 fpos = fract(st);
    
    float n = hash(ipos);
    if (n > 0.98) {
        float size = 0.02 * n;
        float dist = length(fpos - 0.5);
        float star = smoothstep(size, size * 0.5, dist);
        star *= 0.5 + 0.5 * sin(u_time * 2.0 + n * 10.0);
        color += star * vec3(0.0, 0.83, 1.0);
    }
    
    gl_FragColor = vec4(color, 1.0);
}`;
        function cs(type: number, src: string) {
          const s = gl!.createShader(type)!;
          gl!.shaderSource(s, src);
          gl!.compileShader(s);
          return s;
        }
        const prog = gl.createProgram()!;
        gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs));
        gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs));
        gl.linkProgram(prog);
        gl.useProgram(prog);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const pos = gl.getAttribLocation(prog, 'a_position');
        gl.enableVertexAttribArray(pos);
        gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
        const uTime = gl.getUniformLocation(prog, 'u_time');
        const uRes = gl.getUniformLocation(prog, 'u_resolution');

        function render(t: number) {
          if (typeof ResizeObserver === 'undefined') syncSize();
          gl!.useProgram(prog);
          gl!.viewport(0, 0, canvas.width, canvas.height);
          if (uTime !== null) gl!.uniform1f(uTime, t * 0.001);
          if (uRes !== null) gl!.uniform2f(uRes, canvas.width, canvas.height);
          gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
          requestAnimationFrame(render);
        }
        render(0);
      }
    }
  }, []);

  const initThreeJs = () => {
    const container = document.getElementById('threejs-container-ANIMATION_3');
    if (!container || (window as any).THREE === undefined) return;
    const THREE = (window as any).THREE;
    
    container.innerHTML = ""; // Clear existing before re-rendering
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // NEXORA Orb
    const geometry = new THREE.IcosahedronGeometry(2, 2);
    const material = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        wireframe: true,
        transparent: true,
        opacity: 0.8,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.5
    });
    const orb = new THREE.Mesh(geometry, material);
    scene.add(orb);

    // Internal core
    const coreGeom = new THREE.SphereGeometry(0.8, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x7b2fff });
    const core = new THREE.Mesh(coreGeom, coreMat);
    scene.add(core);

    // Lights
    const pLight = new THREE.PointLight(0x00d4ff, 2, 10);
    pLight.position.set(2, 2, 2);
    scene.add(pLight);

    const aLight = new THREE.AmbientLight(0x404040);
    scene.add(aLight);

    function animate() {
        requestAnimationFrame(animate);
        orb.rotation.y += 0.005;
        orb.rotation.x += 0.002;
        
        const time = Date.now() * 0.001;
        orb.scale.setScalar(1 + Math.sin(time) * 0.05);
        core.scale.setScalar(1 + Math.cos(time * 2) * 0.1);
        
        renderer.render(scene, camera);
    }

    const onResize = () => {
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    animate();
    
    return () => {
      window.removeEventListener('resize', onResize);
    }
  }

  // Feature Card microinteractions & Scroll Reveal
  useEffect(() => {
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach(card => {
        card.addEventListener('touchstart', () => { (card as HTMLElement).style.transform = 'scale(0.98)'; });
        card.addEventListener('touchend', () => { (card as HTMLElement).style.transform = 'scale(1)'; });
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('opacity-100', 'translate-y-0');
                entry.target.classList.remove('opacity-0', 'translate-y-10');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.feature-card, .glass-panel').forEach(el => {
        el.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-10');
        observer.observe(el);
    });
  }, []);

  return (
    <>
      <Script src="https://ajax.googleapis.com/ajax/libs/threejs/r125/three.min.js" strategy="lazyOnload" onLoad={initThreeJs} />
      
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_4px_30px_rgba(0,0,0,0.1)] h-20 flex justify-between items-center px-margin-mobile">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>rocket_launch</span>
          <h1 className="font-display-lg text-headline-lg-mobile tracking-tighter text-primary drop-shadow-[0_0_15px_rgba(0,212,255,0.4)] orbitron">NEXORA</h1>
        </div>
        <div className="h-10 w-10 rounded-full bg-surface-variant overflow-hidden border border-primary/30">
          <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFPE_emoR2GEfOl4sxAFDt6rzeNXXM0cMhp6IjOLQ9vK8RDEoh5ZTX3oWps2_JDQVZJKZ-wgCYaOttVuAZ_jo3pQU0MW7chGpA2Sd8SmVterBAZp4Vn4I9C8vahItf0q0zF84VkfRvK2T92qusJk_zugurLwbXrgm1eN9a_g1IqM3Mfs-EzK7QuLB1oCCLMDUkK0AZUOeqHscg-aBTAE8hB7JrRDATdH2Tjt9WPDI_IYMnmgWRmMbJJZD9dwYMX5yKS9MwKkskA58" alt="Profile" />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[795px] flex flex-col items-center justify-center pt-24 pb-12 overflow-hidden px-margin-mobile">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 w-full h-full opacity-60">
            <canvas id="shader-canvas-ANIMATION_2" style={{display: 'block', width: '100%', height: '100%'}}></canvas>
          </div>
        </div>
        
        {/* 3D Orb Focal Point */}
        <div className="relative z-10 w-full aspect-square max-w-[300px] mb-8">
          <div className="absolute inset-0 w-full h-full">
            <div id="threejs-container-ANIMATION_3" style={{width: '100%', height: '100%'}}></div>
          </div>
        </div>

        <div className="relative z-20 text-center">
          <h2 className="font-display-xl text-display-lg leading-tight mb-4 orbitron text-primary glow-text-cyan">
            Don't Just Build a Startup.<br/><span className="text-white">Know If It Will Survive.</span>
          </h2>
          <p className="font-body-lg text-on-surface-variant mb-8 max-w-md mx-auto">
            NEXORA analyzes your idea, stress-tests it like a real investor, and maps your competition—before you spend a single rupee.
          </p>
          <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
            {!isLoaded ? (
              <div className="h-14 rounded-xl bg-surface-variant animate-pulse w-full"></div>
            ) : userId ? (
              <>
                <Link href="/sync-role?role=entrepreneur" className="bg-primary-container text-on-primary-container h-14 rounded-xl font-bold orbitron flex items-center justify-center gap-2 glow-cyan active:scale-95 transition-transform w-full">
                  Founder Access <span className="material-symbols-outlined">rocket_launch</span>
                </Link>
                <Link href="/sync-role?role=investor" className="bg-secondary-container text-on-secondary-container h-14 rounded-xl font-bold orbitron flex items-center justify-center gap-2 glow-cyan active:scale-95 transition-transform w-full">
                  Investor Access <span className="material-symbols-outlined">monitoring</span>
                </Link>
              </>
            ) : (
              <>
                <SignInButton mode="modal" forceRedirectUrl="/sync-role?role=entrepreneur" signUpForceRedirectUrl="/sync-role?role=entrepreneur">
                  <button className="bg-primary-container text-on-primary-container h-14 rounded-xl font-bold orbitron flex items-center justify-center gap-2 glow-cyan active:scale-95 transition-transform w-full">
                    Founder Access <span className="material-symbols-outlined">rocket_launch</span>
                  </button>
                </SignInButton>
                <SignInButton mode="modal" forceRedirectUrl="/sync-role?role=investor" signUpForceRedirectUrl="/sync-role?role=investor">
                  <button className="bg-secondary-container text-on-secondary-container h-14 rounded-xl font-bold orbitron flex items-center justify-center gap-2 glow-cyan active:scale-95 transition-transform w-full">
                    Investor Access <span className="material-symbols-outlined">monitoring</span>
                  </button>
                </SignInButton>
              </>
            )}
          </div>
        </div>

        {/* Stats Pills */}
        <div className="relative z-20 mt-12 flex flex-wrap justify-center gap-3">
          <div className="px-4 py-2 glass-panel rounded-full border border-primary/20 flex items-center gap-2">
            <span className="text-primary font-bold orbitron text-body-sm">10,000+</span>
            <span className="text-xs uppercase font-label-caps opacity-70">Ideas Analyzed</span>
          </div>
          <div className="px-4 py-2 glass-panel rounded-full border border-tertiary/20 flex items-center gap-2">
            <span className="text-tertiary font-bold orbitron text-body-sm">94%</span>
            <span className="text-xs uppercase font-label-caps opacity-70">Accuracy</span>
          </div>
          <div className="px-4 py-2 glass-panel rounded-full border border-secondary/20 flex items-center gap-2">
            <span className="text-secondary font-bold orbitron text-body-sm">500+</span>
            <span className="text-xs uppercase font-label-caps opacity-70">Founders Guided</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-margin-mobile bg-surface-container-lowest">
        <div className="mb-12">
          <span className="font-label-caps text-primary tracking-widest text-xs uppercase mb-2 block">Capabilities</span>
          <h3 className="font-display-lg text-headline-lg-mobile orbitron text-on-surface">Neural Market Intelligence</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="feature-card glass-panel p-6 rounded-2xl transition-all duration-300">
            <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary">analytics</span>
            </div>
            <h4 className="orbitron font-bold text-lg mb-2">AI Idea Scoring</h4>
            <p className="text-body-sm text-on-surface-variant">Instant quantitative validation based on current market trends, saturation, and consumer behavior models.</p>
          </div>
          <div className="feature-card glass-panel p-6 rounded-2xl transition-all duration-300">
            <div className="h-12 w-12 rounded-lg bg-secondary/10 border border-secondary/30 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-secondary">forum</span>
            </div>
            <h4 className="orbitron font-bold text-lg mb-2">Investor Interview</h4>
            <p className="text-body-sm text-on-surface-variant">Simulate high-stakes pitches with an AI trained on top-tier VC decision-making frameworks.</p>
          </div>
          <div className="feature-card glass-panel p-6 rounded-2xl transition-all duration-300">
            <div className="h-12 w-12 rounded-lg bg-tertiary/10 border border-tertiary/30 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-tertiary">psychology</span>
            </div>
            <h4 className="orbitron font-bold text-lg mb-2">Market Intelligence</h4>
            <p className="text-body-sm text-on-surface-variant">Real-time deep-dive into latent user needs and industry shift predictions before they go mainstream.</p>
          </div>
          <div className="feature-card glass-panel p-6 rounded-2xl transition-all duration-300">
            <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary">radar</span>
            </div>
            <h4 className="orbitron font-bold text-lg mb-2">Competitor Radar</h4>
            <p className="text-body-sm text-on-surface-variant">360° visibility of direct and indirect competitors, including stealth-mode players in your niche.</p>
          </div>
          <div className="feature-card glass-panel p-6 rounded-2xl transition-all duration-300">
            <div className="h-12 w-12 rounded-lg bg-secondary/10 border border-secondary/30 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-secondary">map</span>
            </div>
            <h4 className="orbitron font-bold text-lg mb-2">Startup Roadmap</h4>
            <p className="text-body-sm text-on-surface-variant">A step-by-step technical and business execution plan tailored to your specific scoring weaknesses.</p>
          </div>
          <div className="feature-card glass-panel p-6 rounded-2xl transition-all duration-300">
            <div className="h-12 w-12 rounded-lg bg-tertiary/10 border border-tertiary/30 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-tertiary">smart_toy</span>
            </div>
            <h4 className="orbitron font-bold text-lg mb-2">AI Mentor</h4>
            <p className="text-body-sm text-on-surface-variant">24/7 strategic guidance from an engine that has ingested data from over 1,000 successful exits.</p>
          </div>
        </div>
      </section>

      {/* How It Works (Timeline) */}
      <section className="py-20 px-margin-mobile bg-background relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 blur-[100px] rounded-full"></div>
        <div className="mb-12">
          <h3 className="font-display-lg text-headline-lg-mobile orbitron text-center text-on-surface">The Intelligence Protocol</h3>
        </div>
        <div className="relative max-w-sm mx-auto">
          <div className="absolute left-6 top-0 bottom-0 w-px timeline-line opacity-30"></div>
          
          <div className="relative flex gap-8 mb-12 group">
            <div className="z-10 h-12 w-12 rounded-full glass-panel border border-primary flex items-center justify-center bg-background shrink-0 group-hover:scale-110 transition-transform">
              <span className="orbitron text-primary font-bold">01</span>
            </div>
            <div>
              <h4 className="orbitron font-bold text-lg text-primary mb-1">Transmit Idea</h4>
              <p className="text-body-sm text-on-surface-variant">Input your core concept into our secure encrypted intake portal.</p>
            </div>
          </div>
          
          <div className="relative flex gap-8 mb-12 group">
            <div className="z-10 h-12 w-12 rounded-full glass-panel border border-secondary flex items-center justify-center bg-background shrink-0 group-hover:scale-110 transition-transform">
              <span className="orbitron text-secondary font-bold">02</span>
            </div>
            <div>
              <h4 className="orbitron font-bold text-lg text-secondary mb-1">Stress Test</h4>
              <p className="text-body-sm text-on-surface-variant">NEXORA runs 1,000+ simulations against market historicals and future trends.</p>
            </div>
          </div>
          
          <div className="relative flex gap-8 mb-12 group">
            <div className="z-10 h-12 w-12 rounded-full glass-panel border border-tertiary flex items-center justify-center bg-background shrink-0 group-hover:scale-110 transition-transform">
              <span className="orbitron text-tertiary font-bold">03</span>
            </div>
            <div>
              <h4 className="orbitron font-bold text-lg text-tertiary mb-1">Competitor Lock</h4>
              <p className="text-body-sm text-on-surface-variant">We map every active threat and whitespace opportunity in your category.</p>
            </div>
          </div>
          
          <div className="relative flex gap-8 group">
            <div className="z-10 h-12 w-12 rounded-full glass-panel border border-primary-container flex items-center justify-center bg-background shrink-0 group-hover:scale-110 transition-transform">
              <span className="orbitron text-primary-container font-bold">04</span>
            </div>
            <div>
              <h4 className="orbitron font-bold text-lg text-primary-container mb-1">Launch Verdict</h4>
              <p className="text-body-sm text-on-surface-variant">Receive your comprehensive score and optimized execution roadmap.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-margin-mobile bg-surface-container-low overflow-x-auto">
        <div className="mb-12">
          <h3 className="font-display-lg text-headline-lg-mobile orbitron text-on-surface">Founder Transmission</h3>
        </div>
        <div className="flex gap-6 pb-4">
          <div className="min-w-[280px] max-w-[400px] glass-panel p-6 rounded-2xl border-l-4 border-l-primary">
            <div className="flex text-primary mb-3">
              <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
              <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
              <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
              <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
              <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
            </div>
            <p className="text-body-sm mb-6 italic text-on-surface">"NEXORA predicted a competitor pivot three months before it happened. It saved us $50k in wasted dev time."</p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-surface-variant">
                <img className="h-full w-full object-cover rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDl3HotHH0xTbDJrLL-wtyKLPgMmh8FQvm8vRq5hfjOguHJGAOBxDZ6YdZQfCCwta10JmxMo7jyz1lJOdCPwgEvXQddWmRsocuLY6OKmy6QIqA8BCTUQCCvhA-Sbbu_Wl3LLbtkMq4VXkHnKE7dvrt5SsgqbXHYlTSwd8vEnhK0MB9fHXBzLsKqx_KrnlYnD-Km8KPBUskkSXFpkX3RitFpyuf_bpkMke2ThsrOhua_bmllrWegl7RJT6q8lo8xBFJVYBat4Fls168" alt="Profile" />
              </div>
              <div>
                <p className="font-bold text-xs orbitron">Aria V.</p>
                <p className="text-[10px] text-on-surface-variant uppercase font-label-caps">Founder, Pulse AI</p>
              </div>
            </div>
          </div>
          <div className="min-w-[280px] max-w-[400px] glass-panel p-6 rounded-2xl border-l-4 border-l-secondary">
            <div className="flex text-secondary mb-3">
              <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
              <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
              <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
              <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
              <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star_half</span>
            </div>
            <p className="text-body-sm mb-6 italic text-on-surface">"The Investor Interview simulation is brutal but necessary. It prepped me for our Series A like nothing else."</p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-surface-variant">
                <img className="h-full w-full object-cover rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA15n_euT1hRnSvuEJ9y30t5Z3c_zQ3t5uJf1c8m_LGwzxoXmWom1XV0ZaenxM9x6-sRX7FFDxPAjOlfZlfxTpxDYQyTKfIHHRLCbrGxQfBD6Q_evLrUuIbW29GRGqSw60wDIxgBesncT2JOjLF671lxPD31zaXvbKRycJffMcwGHt9JTc4RWZtY1RSOcasZtJNvAho61R-1mL-KMTUUYS8akCR-t0a0GpA_rN4lN5Z4URK-VCVSRUU5JUKfIobY-8O3-AAkoTaNCk" alt="Profile" />
              </div>
              <div>
                <p className="font-bold text-xs orbitron">Marcus K.</p>
                <p className="text-[10px] text-on-surface-variant uppercase font-label-caps">CTO, Orbit Dynamics</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-margin-mobile text-center bg-background relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          {/* We can just reuse the shader component here or a simple gradient since ID must be unique */}
          <div className="w-full h-full bg-gradient-to-t from-primary/10 to-transparent" />
        </div>
        <div className="relative z-10">
          <h3 className="font-display-lg text-headline-lg-mobile orbitron mb-6 text-on-surface">Ready to Stress-Test Your Vision?</h3>
          <p className="text-body-lg text-on-surface-variant mb-10 max-w-sm mx-auto">Get your first analysis report in under 5 minutes.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!isLoaded ? (
              <div className="h-16 w-48 rounded-xl bg-surface-variant animate-pulse"></div>
            ) : userId ? (
              <>
                <Link href="/sync-role?role=entrepreneur" className="inline-flex w-full sm:w-auto px-8 bg-primary-container text-on-primary-container h-16 rounded-xl font-black orbitron text-lg glow-cyan shadow-xl shadow-primary/20 active:scale-95 transition-all items-center justify-center">
                  START FOUNDER SCAN
                </Link>
                <Link href="/sync-role?role=investor" className="inline-flex w-full sm:w-auto px-8 bg-secondary-container text-on-secondary-container h-16 rounded-xl font-black orbitron text-lg shadow-xl shadow-secondary/20 active:scale-95 transition-all items-center justify-center">
                  INVESTOR PORTAL
                </Link>
              </>
            ) : (
              <>
                <SignInButton mode="modal" forceRedirectUrl="/sync-role?role=entrepreneur" signUpForceRedirectUrl="/sync-role?role=entrepreneur">
                  <button className="inline-flex w-full sm:w-auto px-8 bg-primary-container text-on-primary-container h-16 rounded-xl font-black orbitron text-lg glow-cyan shadow-xl shadow-primary/20 active:scale-95 transition-all items-center justify-center">
                    START FOUNDER SCAN
                  </button>
                </SignInButton>
                <SignInButton mode="modal" forceRedirectUrl="/sync-role?role=investor" signUpForceRedirectUrl="/sync-role?role=investor">
                  <button className="inline-flex w-full sm:w-auto px-8 bg-secondary-container text-on-secondary-container h-16 rounded-xl font-black orbitron text-lg shadow-xl shadow-secondary/20 active:scale-95 transition-all items-center justify-center">
                    INVESTOR PORTAL
                  </button>
                </SignInButton>
              </>
            )}
          </div>
          <p className="mt-6 text-xs font-label-caps opacity-50">NO CREDIT CARD REQUIRED. 100% PRIVATE & ENCRYPTED.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-margin-mobile border-t border-outline-variant/20 bg-surface-container-lowest">
        <div className="flex flex-col items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>rocket_launch</span>
            <span className="orbitron font-bold text-xl tracking-widest">NEXORA</span>
          </div>
          <div className="flex gap-6 text-on-surface-variant">
            <span className="material-symbols-outlined">public</span>
            <span className="material-symbols-outlined">terminal</span>
            <span className="material-symbols-outlined">security</span>
          </div>
          <p className="text-[10px] font-label-caps opacity-40 uppercase tracking-widest">© 2024 Nexora Deep Space Systems. All rights reserved.</p>
        </div>
      </footer>
    </>
  )
}
