import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const AMBER = 0xFFC107;
const AMBER_STR = '#FFC107';

export default function HeroScene() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, canvas.offsetWidth / canvas.offsetHeight, 0.1, 100);
    camera.position.set(0, 0, 6);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dir = new THREE.DirectionalLight(0xffffff, 2);
    dir.position.set(5, 5, 5);
    scene.add(dir);
    const pt = new THREE.PointLight(AMBER, 3, 20);
    pt.position.set(-4, -2, 3);
    scene.add(pt);
    const spot = new THREE.SpotLight(0xfff020, 4, 20, 0.5, 1);
    spot.position.set(0, 6, 4);
    scene.add(spot);

    // Chrome sphere
    const sphereGeo = new THREE.IcosahedronGeometry(1, 5);
    const sphereMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 1, roughness: 0.12 });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(2.6, 0.4, -1);
    sphere.scale.setScalar(1.15);
    scene.add(sphere);

    // Wireframe amber shape
    const makeWire = (pos, scale) => {
      const geo = new THREE.DodecahedronGeometry(1, 0);
      const mat = new THREE.MeshStandardMaterial({ color: AMBER, emissive: AMBER, emissiveIntensity: 1.6, wireframe: true, transparent: true, opacity: 0.5 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...pos);
      mesh.scale.setScalar(scale);
      scene.add(mesh);
      return mesh;
    };
    const wire1 = makeWire([0.2, 1.8, -2], 0.7);
    const wire2 = makeWire([-1.4, -1.9, -1], 0.5);

    // Torus knot (glass look)
    const knotGeo = new THREE.TorusKnotGeometry(0.7, 0.24, 120, 24);
    const knotMat = new THREE.MeshStandardMaterial({ color: 0xfff5d6, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.75 });
    const knot = new THREE.Mesh(knotGeo, knotMat);
    knot.position.set(-2.7, -0.3, 0);
    scene.add(knot);

    // Particle field
    const count = 900;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2;
    }
    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const ptMat = new THREE.PointsMaterial({ size: 0.03, color: AMBER, transparent: true, opacity: 0.55, sizeAttenuation: true, depthWrite: false });
    const points = new THREE.Points(ptGeo, ptMat);
    scene.add(points);

    // Float offsets for organic motion
    const floatOffsets = {
      sphere: Math.random() * Math.PI * 2,
      knot: Math.random() * Math.PI * 2,
      wire1: Math.random() * Math.PI * 2,
      wire2: Math.random() * Math.PI * 2,
    };

    // Mouse parallax
    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    // Resize
    const onResize = () => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation loop
    let rafId;
    const clock = new THREE.Clock();
    const targetCam = new THREE.Vector3(0, 0, 6);
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Rotate shapes
      sphere.rotation.y = t * 0.15;
      sphere.rotation.x = t * 0.08;
      knot.rotation.z = t * 0.2;
      knot.rotation.x = t * 0.14;
      wire1.rotation.y = -t * 0.25;
      wire1.rotation.x = t * 0.1;
      wire2.rotation.y = -t * 0.25;
      wire2.rotation.x = t * 0.1;
      points.rotation.y = t * 0.02;

      // Float bob
      sphere.position.y = 0.4 + Math.sin(t * 1.4 + floatOffsets.sphere) * 0.15;
      knot.position.y = -0.3 + Math.sin(t * 1.1 + floatOffsets.knot) * 0.2;
      wire1.position.y = 1.8 + Math.sin(t * 2.0 + floatOffsets.wire1) * 0.25;
      wire2.position.y = -1.9 + Math.sin(t * 2.0 + floatOffsets.wire2) * 0.2;

      // Camera parallax
      targetCam.x += (mouse.x * 1.6 - targetCam.x) * 0.04;
      targetCam.y += (mouse.y * 1.0 - targetCam.y) * 0.04;
      camera.position.x = targetCam.x;
      camera.position.y = targetCam.y;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}