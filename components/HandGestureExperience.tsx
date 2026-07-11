import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// import { Hands, Results } from '@mediapipe/hands'; // Removed due to ESM issues
import { X, Loader2, Camera as CameraIcon } from 'lucide-react';

// Declare global types for MediaPipe Hands as loaded via script tag
declare global {
  class Hands {
    constructor(config: { locateFile: (file: string) => string });
    setOptions(options: {
      maxNumHands?: number;
      modelComplexity?: number;
      minDetectionConfidence?: number;
      minTrackingConfidence?: number;
    }): void;
    onResults(callback: (results: Results) => void): void;
    send(input: { image: HTMLVideoElement }): Promise<void>;
    close(): void;
  }

  interface Results {
    multiHandLandmarks: { x: number; y: number; z: number }[][];
    image: any;
  }
}

interface HandGestureExperienceProps {
  onClose: () => void;
}

const PARTICLE_COUNT = 4000;

export const HandGestureExperience: React.FC<HandGestureExperienceProps> = ({ onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [activeShape, setActiveShape] = useState<'heart' | 'flower' | 'saturn' | 'buddha' | 'fireworks'>('heart');
  const [particleColor, setParticleColor] = useState('#d97706'); // Gold default
  const [handDistance, setHandDistance] = useState<number>(0);
  const [errorType, setErrorType] = useState<'camera' | 'mediapipe' | 'unsupported' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  const demoModeRef = useRef<boolean>(false);

  // Sync state to ref
  useEffect(() => {
    demoModeRef.current = demoMode;
  }, [demoMode]);

  // Refs for animation loop access without re-renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const frameIdRef = useRef<number>(0);
  const detectionFrameIdRef = useRef<number>(0);
  const targetPositionsRef = useRef<Float32Array | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // --- Shape Generation Logic ---
  const getShapePositions = (type: string): Float32Array => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      let x = 0, y = 0, z = 0;

      if (type === 'heart') {
        // Parametric Heart
        const t = Math.random() * Math.PI * 2;
        const r = Math.random(); // volume filler
        // x = 16sin^3(t)
        // y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
        const scale = 0.15 * Math.sqrt(r); // Scale down
        x = scale * 16 * Math.pow(Math.sin(t), 3);
        y = scale * (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
        z = (Math.random() - 0.5) * 1.5; // Thickness
        // Scatter slightly
        x += (Math.random() - 0.5) * 0.2;
        y += (Math.random() - 0.5) * 0.2;
      } 
      else if (type === 'flower') {
        // Rose Curve (Rhodonea)
        const k = 4; // petals
        const theta = Math.random() * Math.PI * 2;
        const r_base = Math.cos(k * theta);
        const r = r_base + (Math.random() * 0.5); // fuzziness
        const phi = (Math.random() - 0.5) * Math.PI; // 3D spread
        const scale = 3;
        
        x = scale * r * Math.cos(theta) * Math.cos(phi);
        y = scale * r * Math.sin(theta) * Math.cos(phi);
        z = scale * r * Math.sin(phi) * 0.5;
      }
      else if (type === 'saturn') {
        const rand = Math.random();
        if (rand < 0.4) {
          // Planet Body
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = 1.5 * Math.cbrt(Math.random()); 
          x = r * Math.sin(phi) * Math.cos(theta);
          y = r * Math.sin(phi) * Math.sin(theta);
          z = r * Math.cos(phi);
        } else {
          // Rings
          const theta = Math.random() * Math.PI * 2;
          const r = 2.2 + Math.random() * 1.5; // Ring radius
          x = r * Math.cos(theta);
          z = r * Math.sin(theta); // Flat on XZ plane
          y = (Math.random() - 0.5) * 0.1; // Thin disk
          
          // Tilt the ring
          const tilt = Math.PI / 6;
          const y_new = y * Math.cos(tilt) - z * Math.sin(tilt);
          const z_new = y * Math.sin(tilt) + z * Math.cos(tilt);
          y = y_new;
          z = z_new;
        }
      }
      else if (type === 'buddha') {
        // Approximate meditative figure using stacked spheres/cones
        const rand = Math.random();
        
        if (rand < 0.2) {
          // Head
          const r = 0.6 * Math.cbrt(Math.random());
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          x = r * Math.sin(phi) * Math.cos(theta);
          y = r * Math.sin(phi) * Math.sin(theta) + 1.8; // Move up
          z = r * Math.cos(phi);
        } else if (rand < 0.6) {
          // Torso (Cone-ish)
          const h = Math.random() * 2; // Height 0 to 2
          const r_torso = 0.5 + (1 - h/2) * 0.8; // Wider at bottom
          const theta = Math.random() * Math.PI * 2;
          x = r_torso * Math.cos(theta) * Math.sqrt(Math.random());
          z = r_torso * Math.sin(theta) * Math.sqrt(Math.random());
          y = h - 0.5; 
        } else {
          // Crossed Legs / Base
          const theta = Math.random() * Math.PI * 2;
          const r_base = 2 * Math.sqrt(Math.random());
          x = r_base * Math.cos(theta);
          z = r_base * Math.sin(theta);
          y = -0.5 + (Math.random() * 0.5); // Base layer
        }
      }
      else if (type === 'fireworks') {
        // Explosion sphere
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 4 * Math.random(); // Large spread
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
      }

      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;
    }
    return positions;
  };

  // --- Initialization ---
  useEffect(() => {
    isMountedRef.current = true;
    if (!containerRef.current || !canvasRef.current) return;

    // 1. Setup Three.js
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      alpha: true,
      antialias: true 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;

    // Particles
    const geometry = new THREE.BufferGeometry();
    const positions = getShapePositions('heart');
    targetPositionsRef.current = positions; // Start with heart
    geometry.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
    
    const material = new THREE.PointsMaterial({
      color: new THREE.Color(particleColor),
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;
    geometryRef.current = geometry;

    // 2. Setup MediaPipe Hands & Camera
    let hands: any = null;
    let cameraStream: MediaStream | null = null;

    const loadAndStartHands = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("UNSUPPORTED_BROWSER");
        }

        if (typeof Hands === 'undefined') {
          const loadScriptPromise = new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
            script.crossOrigin = 'anonymous';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("CDN_FAILURE"));
            document.head.appendChild(script);
          });

          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error("TIMEOUT")), 10000)
          );

          await Promise.race([loadScriptPromise, timeoutPromise]);
        }

        if (!isMountedRef.current) return;

        // Double check global hands
        if (typeof Hands === 'undefined') {
          throw new Error("MEDIAPIPE_CONSTRUCTOR_FAILED");
        }

        hands = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults(onResults);

        // Setup camera
        if (!videoRef.current) return;
        
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 640 }, 
              height: { ideal: 480 }, 
              facingMode: 'user' 
            } 
          });
          
          cameraStream = stream;
          if (videoRef.current && isMountedRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            
            setLoading(false);
            
            // Start detection loop
            const detectFrame = async () => {
              if (!isMountedRef.current) return;
              
              if (videoRef.current && videoRef.current.readyState >= 2 && hands) {
                try {
                  await hands.send({ image: videoRef.current });
                } catch (e) {
                  console.error("Tracking error:", e);
                }
              }
              
              if (isMountedRef.current) {
                detectionFrameIdRef.current = requestAnimationFrame(detectFrame);
              }
            };
            detectFrame();
          }
        } catch (err: any) {
          console.warn("Camera initialization warning (expected if no webcam is present):", err);
          if (isMountedRef.current) {
            setLoading(false);
            setDemoMode(true);
            const errName = err.name || '';
            const errMsg = err.message || '';
            if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
              setErrorMessage("Camera permission was denied. Please allow camera access in your browser settings to experience hand gesture control, or start Demo Mode.");
              setErrorType('camera');
            } else if (
              errName === 'NotFoundError' || 
              errName === 'DevicesNotFoundError' || 
              errMsg.toLowerCase().includes('requested device not found') ||
              errMsg.toLowerCase().includes('device not found') ||
              errMsg.toLowerCase().includes('devices not found')
            ) {
              setErrorMessage("No webcam device was found on your system. Please connect a camera or enter Demo Mode.");
            } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
              setErrorMessage("Your webcam is currently being used by another application. Please close other software and retry, or enter Demo Mode.");
              setErrorType('camera');
            } else {
              setErrorMessage("Could not initialize your webcam. Please check your connections, refresh, or enter Demo Mode.");
              setErrorType('camera');
            }
          }
        }
      } catch (err: any) {
        console.error("MediaPipe load error:", err);
        if (isMountedRef.current) {
          setLoading(false);
          setDemoMode(true);
          if (err.message === 'UNSUPPORTED_BROWSER') {
            setErrorType('unsupported');
            setErrorMessage("Your web browser or security context does not support secure camera access APIs. Please make sure you are using HTTPS, or switch to Demo Mode.");
          } else if (err.message === 'CDN_FAILURE' || err.message === 'TIMEOUT') {
            setErrorType('mediapipe');
            setErrorMessage("Failed to fetch hand gesture libraries from CDN (network timeout or block). Please check your internet, or enter Demo Mode.");
          } else {
            setErrorType('mediapipe');
            setErrorMessage("An unexpected error occurred while loading AI tracking models. Please try again or run Demo Mode.");
          }
        }
      }
    };

    loadAndStartHands();

    // 4. Animation Loop
    const animate = (time: number) => {
      frameIdRef.current = requestAnimationFrame(animate);
      
      if (particlesRef.current && geometryRef.current && targetPositionsRef.current) {
        // Rotate the whole system slowly
        particlesRef.current.rotation.y += 0.002;
        particlesRef.current.rotation.x += 0.001;

        if (demoModeRef.current) {
          const t = (time || performance.now()) * 0.001;
          const pulse = 0.35 + 0.25 * Math.sin(t); 
          const targetScale = 1 + (pulse * 3);
          particlesRef.current.scale.setScalar(Math.max(0.1, targetScale));
        }

        // Particle Morphing (Lerp positions)
        const currentPositions = geometryRef.current.attributes.position.array as Float32Array;
        const targetPositions = targetPositionsRef.current;
        
        for (let i = 0; i < currentPositions.length; i++) {
          // Lerp factor (speed of morph)
          currentPositions[i] += (targetPositions[i] - currentPositions[i]) * 0.05;
        }
        geometryRef.current.attributes.position.needsUpdate = true;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate(0);

    // Cleanup
    return () => {
      isMountedRef.current = false;
      cancelAnimationFrame(frameIdRef.current);
      cancelAnimationFrame(detectionFrameIdRef.current);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      
      if (rendererRef.current) rendererRef.current.dispose();
      if (hands) {
        try {
          hands.close();
        } catch (e) {
          console.warn("Error closing hands:", e);
        }
      }
    };
  }, [retryCount]); // Run once on mount or when retryCount changes

  // --- Updates ---
  
  // Handle Shape Change
  useEffect(() => {
    targetPositionsRef.current = getShapePositions(activeShape);
  }, [activeShape]);

  // Handle Color Change
  useEffect(() => {
    if (particlesRef.current) {
      (particlesRef.current.material as THREE.PointsMaterial).color.set(particleColor);
    }
  }, [particleColor]);

  // Handle Hand Distance Scaling
  useEffect(() => {
    if (particlesRef.current) {
        // Smooth scale transition
        const targetScale = 1 + (handDistance * 3); // Base scale 1, max +3
        const currentScale = particlesRef.current.scale.x;
        // Simple lerp for scale here or just set it (results loop runs fast enough usually)
        particlesRef.current.scale.setScalar(Math.max(0.1, targetScale)); 
    }
  }, [handDistance]);


  // MediaPipe Results
  const onResults = (results: Results) => {
    if (!isMountedRef.current) return;
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length === 2) {
      // Get Index finger tips (Landmark 8)
      const hand1 = results.multiHandLandmarks[0][8];
      const hand2 = results.multiHandLandmarks[1][8];
      
      // Calculate Euclidean distance (simple 2D projection distance for simplicity)
      const dist = Math.sqrt(
        Math.pow(hand1.x - hand2.x, 2) + 
        Math.pow(hand1.y - hand2.y, 2)
      );
      
      setHandDistance(dist);
    } else {
      // Reset slowly if hands lost? Or keep last? Let's reset to default
      setHandDistance(0.3); // Default moderate size
    }
  };


  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
        
      {/* UI Overlay */}
      <div className="absolute top-6 right-6 z-50 flex gap-4">
        <button 
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="absolute top-6 left-6 z-50 select-none">
        <h2 className="text-2xl font-bold text-white mb-1">Gesture Magic</h2>
        {demoMode ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <p className="text-gold/95 font-semibold text-sm flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold animate-ping" />
                Demo Mode Active
              </p>
              <button
                onClick={() => {
                  setDemoMode(false);
                  setLoading(true);
                  setErrorType(null);
                  setErrorMessage(null);
                  setRetryCount(prev => prev + 1);
                }}
                className="text-xs text-white/50 hover:text-white underline cursor-pointer transition-colors"
              >
                (Try Camera Mode)
              </button>
            </div>
            {errorMessage && (
              <span className="text-[10px] text-white/40 max-w-xs block leading-normal">
                Note: {errorMessage.split(".")[0]}.
              </span>
            )}
          </div>
        ) : (
          <p className="text-white/60 text-sm">Use <span className="text-gold font-bold">Two Hands</span> to expand the particles.</p>
        )}
      </div>

      {/* Controls Panel */}
      <div className="absolute bottom-10 z-50 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl flex flex-col md:flex-row gap-8 shadow-2xl animate-fade-in-up">
        
        {/* Shape Selector */}
        <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-white/80 uppercase tracking-wider">Shape Template</label>
            <div className="grid grid-cols-5 gap-2">
                {[
                    { id: 'heart', label: 'Heart' },
                    { id: 'flower', label: 'Flower' },
                    { id: 'saturn', label: 'Saturn' },
                    { id: 'buddha', label: 'Zen' },
                    { id: 'fireworks', label: 'Blast' },
                ].map((s) => (
                    <button
                        key={s.id}
                        onClick={() => setActiveShape(s.id as any)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                            activeShape === s.id 
                            ? 'bg-gold text-white border-gold' 
                            : 'bg-transparent text-white/70 border-white/20 hover:bg-white/10'
                        }`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Color Picker */}
        <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-white/80 uppercase tracking-wider">Energy Color</label>
            <div className="flex gap-3">
                {['#d97706', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'].map((c) => (
                    <button
                        key={c}
                        onClick={() => setParticleColor(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                            particleColor === c ? 'border-white scale-110' : 'border-transparent opacity-80'
                        }`}
                        style={{ backgroundColor: c }}
                        aria-label="Set Color"
                    />
                ))}
            </div>
        </div>

      </div>

      {/* Rendering Area */}
      <div ref={containerRef} className="w-full h-full relative">
        {loading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-20">
                <Loader2 size={48} className="animate-spin text-gold mb-4" />
                <p className="text-lg font-light tracking-widest animate-pulse">Initializing AI Vision...</p>
                <div className="mt-2 flex items-center gap-2 text-sm text-white/50">
                    <CameraIcon size={16} />
                    <span>Please allow camera access</span>
                </div>
             </div>
        )}

        {errorType && !demoMode && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-20 bg-black/85 px-6 text-center">
            <div className="bg-slate-900/90 border border-white/10 p-8 rounded-2xl flex flex-col items-center gap-4 max-w-md shadow-2xl animate-fade-in-up">
              <CameraIcon size={40} className="text-gold animate-pulse mb-1" />
              <h3 className="text-lg font-bold text-white tracking-wide">Gesture Camera Offline</h3>
              <p className="text-xs text-white/70 leading-relaxed max-w-sm">
                {errorMessage}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
                <button
                  onClick={() => {
                    setDemoMode(true);
                    setErrorType(null);
                  }}
                  className="flex-1 bg-gold hover:bg-amber-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Enter Demo Mode
                </button>
                <button
                  onClick={() => {
                    setLoading(true);
                    setErrorType(null);
                    setErrorMessage(null);
                    setRetryCount(prev => prev + 1);
                  }}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Retry Setup
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Hidden Input Video */}
        <video 
            ref={videoRef}
            className="hidden" // Processed in background, not shown
            playsInline
            muted
        />
        
        {/* ThreeJS Output */}
        <canvas ref={canvasRef} className="block w-full h-full" />
      </div>
    </div>
  );
};