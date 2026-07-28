import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Ambient 3D scene: floating amber spheres + wireframe rings + particle cloud
// All vanilla Three.js for max perf — no R3F overhead.
export default function HeroScene3D() {
  const canvasRef = useRef(null);
  const [webglAvailable, setWebglAvailable] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      // Some previews and low-power browsers do not expose WebGL.
      // The surrounding hero remains fully usable without the 3D layer.
      setWebglAvailable(false);
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(60, canvas.offsetWidth / canvas.offsetHeight, 0.1, 100);
    cam.position.set(0, 0, 7);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const pt1 = new THREE.PointLight(0xFFC107, 8, 30); pt1.position.set(-3, 4, 5); scene.add(pt1);
    const pt2 = new THREE.PointLight(0xFFF020, 5, 20); pt2.position.set(5, -3, 3); scene.add(pt2);

    // ── Floating spheres ──────────────────────────────────────────────────────
    const spheres = [];
    const sphereData = [
      { pos: [-3.8, 1.5, -2],  r: 0.55, roughness: 0.08, metalness: 1.0, emissive: 0x221100 },
      { pos: [3.5, -1.2, -1],  r: 0.38, roughness: 0.12, metalness: 0.9, emissive: 0x110800 },
      { pos: [-1.0, -2.2, 0.5],r: 0.22, roughness: 0.0,  metalness: 1.0, emissive: 0x331500 },
      { pos: [1.6, 2.4, -1.5], r: 0.30, roughness: 0.05, metalness: 1.0, emissive: 0x221100 },
    ];
    sphereData.forEach(({ pos, r, roughness, metalness, emissive }) => {
      const geo = new THREE.IcosahedronGeometry(r, 4);
      const mat = new THREE.MeshStandardMaterial({ color: 0xFFC107, roughness, metalness, emissiveIntensity: 0.6, emissive });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...pos);
      scene.add(mesh);
      spheres.push({ mesh, baseY: pos[1], speed: 0.6 + Math.random() * 0.6, offset: Math.random() * Math.PI * 2 });
    });

    // ── Wireframe torus rings ─────────────────────────────────────────────────
    const rings = [];
    [
      { pos: [2.8, 1.0, -3], rx: Math.PI / 3, ry: 0.4, rz: Math.PI / 6, r: 1.2, tube: 0.02 },
      { pos: [-2.5, -1.5, -4], rx: Math.PI / 5, ry: 0.2, rz: 0, r: 1.6, tube: 0.015 },
    ].forEach(({ pos, rx, ry, rz, r, tube }) => {
      const geo = new THREE.TorusGeometry(r, tube, 3, 80);
      const mat = new THREE.MeshBasicMaterial({ color: 0xFFC107, transparent: true, opacity: 0.18, wireframe: false });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...pos);
      mesh.rotation.set(rx, ry, rz);
      scene.add(mesh);
      rings.push({ mesh, speed: 0.15 + Math.random() * 0.12 });
    });

    // ── Floating amber lines (edges of a dodecahedron) ────────────────────────
    const edgeGeo = new THREE.EdgesGeometry(new THREE.DodecahedronGeometry(1.1, 0));
    const edgeMat = new THREE.LineBasicMaterial({ color: 0xFFC107, transparent: true, opacity: 0.12 });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    edges.position.set(0, 0, -2.5);
    scene.add(edges);

    // ── Particle cloud ────────────────────────────────────────────────────────
    const COUNT = 600;
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 18;
      pos[i*3+1] = (Math.random() - 0.5) * 12;
      pos[i*3+2] = (Math.random() - 0.5) * 10 - 3;
    }
    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const ptMat = new THREE.PointsMaterial({ size: 0.028, color: 0xFFC107, transparent: true, opacity: 0.35, sizeAttenuation: true, depthWrite: false });
    const points = new THREE.Points(ptGeo, ptMat);
    scene.add(points);

    // ── Mouse parallax ────────────────────────────────────────────────────────
    const mouse = { x: 0, y: 0 }, camTarget = { x: 0, y: 0 };
    const onMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove);

    const onResize = () => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      cam.aspect = w / h; cam.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // ── Render loop ───────────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      spheres.forEach(({ mesh, baseY, speed, offset }) => {
        mesh.rotation.y += 0.005;
        mesh.rotation.x += 0.003;
        mesh.position.y = baseY + Math.sin(t * speed + offset) * 0.18;
      });

      rings.forEach(({ mesh, speed }) => {
        mesh.rotation.z += speed * 0.01;
        mesh.rotation.x += speed * 0.006;
      });

      edges.rotation.y = t * 0.07;
      edges.rotation.x = t * 0.045;

      points.rotation.y = t * 0.008;
      points.rotation.x = Math.sin(t * 0.05) * 0.04;

      camTarget.x += (mouse.x * 1.2 - camTarget.x) * 0.035;
      camTarget.y += (mouse.y * 0.7 - camTarget.y) * 0.035;
      cam.position.x = camTarget.x;
      cam.position.y = camTarget.y;
      cam.lookAt(0, 0, 0);

      renderer.render(scene, cam);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, []);

  if (!webglAvailable) {
    return (
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
          background:
            'radial-gradient(circle at 78% 35%, rgba(255,193,7,0.12), transparent 24%), radial-gradient(circle at 18% 70%, rgba(255,193,7,0.06), transparent 30%)',
        }}
      />
    );
  }

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} />;
}