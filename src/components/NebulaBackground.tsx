'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

const NebulaBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const foodMeshesRef = useRef<THREE.Group[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0612, 0.001);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 50;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const particleCount = 5000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const colorPalette = [
      new THREE.Color(0xff6b6b),
      new THREE.Color(0xffd93d),
      new THREE.Color(0x4ecdc4),
      new THREE.Color(0x6c5ce7),
      new THREE.Color(0xff7675)
    ];

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const radius = Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = Math.random() * 2 + 0.5;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    const foodItems = [
      { name: 'Tech Ramen', color: 0xff6b6b, position: [0, 5, 0] },
      { name: 'AI Burger', color: 0xffd93d, position: [15, -5, 5] },
      { name: 'Sushi Matrix', color: 0x4ecdc4, position: [-12, -8, -3] },
      { name: 'Pizza Galaxy', color: 0x6c5ce7, position: [8, 10, -5] },
      { name: 'Taco Nova', color: 0xff7675, position: [-10, 2, 8] }
    ];

    foodItems.forEach((food, index) => {
      const group = new THREE.Group();

      const mainGeometry = new THREE.IcosahedronGeometry(2.5, 1);
      const mainMaterial = new THREE.MeshPhongMaterial({
        color: food.color,
        emissive: food.color,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.9,
        wireframe: false
      });
      const mainMesh = new THREE.Mesh(mainGeometry, mainMaterial);
      group.add(mainMesh);

      const wireGeometry = new THREE.IcosahedronGeometry(2.8, 1);
      const wireMaterial = new THREE.MeshBasicMaterial({
        color: food.color,
        wireframe: true,
        transparent: true,
        opacity: 0.4
      });
      const wireMesh = new THREE.Mesh(wireGeometry, wireMaterial);
      group.add(wireMesh);

      const ringGeometry = new THREE.TorusGeometry(3.5, 0.1, 16, 100);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: food.color,
        transparent: true,
        opacity: 0.6
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);

      group.position.set(food.position[0], food.position[1], food.position[2]);
      group.userData = { 
        originalPosition: new THREE.Vector3(...food.position),
        rotationSpeed: Math.random() * 0.02 + 0.01
      };

      scene.add(group);
      foodMeshesRef.current.push(group);
    });

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xff6b6b, 2, 200);
    pointLight.position.set(20, 20, 20);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x4ecdc4, 2, 200);
    pointLight2.position.set(-20, -20, 20);
    scene.add(pointLight2);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
      };
    };

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (particlesRef.current) {
        particlesRef.current.rotation.x += 0.0005;
        particlesRef.current.rotation.y += 0.001;
      }

      foodMeshesRef.current.forEach((group, index) => {
        group.rotation.x += group.userData.rotationSpeed;
        group.rotation.y += group.userData.rotationSpeed * 0.7;

        const targetX = group.userData.originalPosition.x + mouseRef.current.x * 3;
        const targetY = group.userData.originalPosition.y + mouseRef.current.y * 3;

        gsap.to(group.position, {
          x: targetX,
          y: targetY,
          duration: 0.5,
          ease: 'power2.out'
        });
      });

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: 'linear-gradient(135deg, #0a0612 0%, #1a0f2e 50%, #0f0c1d 100%)' }}
    />
  );
};

export default NebulaBackground;
