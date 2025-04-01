import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import Link from 'next/link';

interface MerkleAnimationProps {
  isVisible: boolean;
  onAnimationComplete?: () => void;
}

export default function MerkleAnimation({ isVisible, onAnimationComplete }: MerkleAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const cameraRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 6, z: 28 });
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const moveSpeed = 0.5;
  
  // Add camera control functions
  const moveCamera = {
    left: () => {
      cameraRef.current.x -= moveSpeed;
    },
    right: () => {
      cameraRef.current.x += moveSpeed;
    },
    up: () => {
      cameraRef.current.y += moveSpeed;
    },
    down: () => {
      cameraRef.current.y -= moveSpeed;
    },
    zoomIn: () => {
      cameraRef.current.z -= moveSpeed;
    },
    zoomOut: () => {
      cameraRef.current.z += moveSpeed;
    }
  };

  // Add touch/click hold functionality
  const [activeControls, setActiveControls] = useState<{ [key: string]: boolean }>({});
  const controlIntervalRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const startControl = (control: string) => {
    setActiveControls(prev => ({ ...prev, [control]: true }));
    moveCamera[control as keyof typeof moveCamera]();
    controlIntervalRef.current[control] = setInterval(() => {
      moveCamera[control as keyof typeof moveCamera]();
    }, 16); // ~60fps
  };

  const stopControl = (control: string) => {
    setActiveControls(prev => ({ ...prev, [control]: false }));
    if (controlIntervalRef.current[control]) {
      clearInterval(controlIntervalRef.current[control]);
      delete controlIntervalRef.current[control];
    }
  };

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(controlIntervalRef.current).forEach(interval => clearInterval(interval));
    };
  }, []);

  // Merkle tree explanation steps
  const explanationSteps = [
    {
      title: "What is a Merkle Tree?",
      content: "A Merkle tree is a fundamental data structure in cryptography and blockchain technology. It allows efficient and secure verification of large data sets."
    },
    {
      title: "How it Works",
      content: "Each leaf node contains a hash of a data block. Parent nodes contain hashes of their children, creating a tree of hashes that culminates in a single root hash."
    },
    {
      title: "Why it Matters",
      content: "Merkle trees enable quick verification of data integrity and efficient proof of inclusion, making them essential for blockchain networks and distributed systems."
    },
    {
      title: "In This Project",
      content: "We use Merkle trees to efficiently verify user eligibility for the airdrop, ensuring secure and gas-efficient distribution of tokens."
    }
  ];

  useEffect(() => {
    if (!isVisible) return;
    
    // Auto-advance explanation steps
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % explanationSteps.length);
    }, 4000);

    return () => clearInterval(stepInterval);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    // Handle keydown
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
    };

    // Handle keyup
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || !containerRef.current) return;
    
    setIsAnimating(true);
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf9fafb);
    
    // Camera setup with adjusted position and field of view
    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(cameraRef.current.x, cameraRef.current.y, cameraRef.current.z);
    camera.lookAt(new THREE.Vector3(0, 6, 0)); // Look at the middle of the tree
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Load IPFS logo texture
    const textureLoader = new THREE.TextureLoader();
    const ipfsTexture = textureLoader.load('/new-logo.jpeg');
    
    // Create IPFS logo sprite material
    const logoMaterial = new THREE.SpriteMaterial({
      map: ipfsTexture,
      transparent: true,
      opacity: 0.8,
    });

    // Create pulsing IPFS logo sprite
    const ipfsSprite = new THREE.Sprite(logoMaterial);
    ipfsSprite.scale.set(3, 3, 1);
    scene.add(ipfsSprite);

    // Store node positions for animation path
    const nodePositions: THREE.Vector3[] = [];
    
    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x6366f1, 2, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Merkle tree components
    const nodes: THREE.Mesh[] = [];
    const lines: THREE.Line[] = [];
    
    // Create glowing node material
    const createNodeMaterial = (color: number) => {
      return new THREE.MeshPhongMaterial({
        color: color,
        shininess: 100,
        emissive: color,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.9,
      });
    };

    // Create root node with enhanced geometry
    const rootGeometry = new THREE.IcosahedronGeometry(0.8, 1);
    const rootMaterial = createNodeMaterial(0x4f46e5);
    const rootNode = new THREE.Mesh(rootGeometry, rootMaterial);
    rootNode.position.set(0, 12, 0);  // Move root node much higher
    rootNode.scale.set(0.01, 0.01, 0.01);
    scene.add(rootNode);
    nodes.push(rootNode);

    // Create level nodes with different geometries
    const createLevelNodes = (positions: THREE.Vector3[], color: number, size: number, geometry: THREE.BufferGeometry) => {
      positions.forEach(position => {
        const nodeMaterial = createNodeMaterial(color);
        const node = new THREE.Mesh(geometry, nodeMaterial);
        node.position.copy(position);
        node.scale.set(0.01, 0.01, 0.01);
        scene.add(node);
        nodes.push(node);
      });
    };

    // Level 1 nodes - adjusted positions higher
    const level1Positions = [
      new THREE.Vector3(-4, 8, 0),  // Moved higher
      new THREE.Vector3(4, 8, 0)    // Moved higher
    ];
    createLevelNodes(level1Positions, 0x6366f1, 0.6, new THREE.OctahedronGeometry(0.6, 0));

    // Level 2 nodes - adjusted positions higher
    const level2Positions = [
      new THREE.Vector3(-6, 4, 0),  // Moved higher
      new THREE.Vector3(-2, 4, 0),
      new THREE.Vector3(2, 4, 0),
      new THREE.Vector3(6, 4, 0)
    ];
    createLevelNodes(level2Positions, 0x818cf8, 0.5, new THREE.TetrahedronGeometry(0.5, 0));

    // Level 3 nodes - adjusted positions higher
    const level3Positions = [
      new THREE.Vector3(-7, 0, 0),  // Moved higher
      new THREE.Vector3(-5, 0, 0),
      new THREE.Vector3(-3, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(3, 0, 0),
      new THREE.Vector3(5, 0, 0),
      new THREE.Vector3(7, 0, 0)
    ];
    createLevelNodes(level3Positions, 0xa5b4fc, 0.4, new THREE.DodecahedronGeometry(0.4, 0));

    // After creating all nodes, collect their positions in order
    const collectNodePositions = () => {
      // Clear existing positions
      nodePositions.length = 0;
      
      // Add positions in the order we want the animation to follow
      // Start from leaves, then up to parents, then to root
      for (let i = nodes.length - 1; i >= 0; i--) {
        nodePositions.push(nodes[i].position.clone());
      }
    };

    // Create dynamic connection lines
    const createConnections = () => {
      // Clear existing lines
      lines.forEach(line => scene.remove(line));
      lines.length = 0;

      // Create new connections with curved paths
      const createCurvedLine = (start: THREE.Vector3, end: THREE.Vector3) => {
        const midPoint = new THREE.Vector3().lerpVectors(start, end, 0.5);
        midPoint.z = -(start.distanceTo(end) * 0.2);

        const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
        const points = curve.getPoints(20); // Reduced points for performance
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        const material = new THREE.LineBasicMaterial({ 
          color: 0x6366f1,
          transparent: true,
          opacity: 0.5,
        });
        
        return new THREE.Line(geometry, material);
      };

      // Create connections between nodes
      nodes.forEach((node, index) => {
        if (index === 0) return; // Skip root node
        const parentIndex = Math.floor((index - 1) / 2);
        const line = createCurvedLine(nodes[parentIndex].position, node.position);
        scene.add(line);
        lines.push(line);
      });
    };

    // Animation timing
    const startTime = Date.now();
    const animationDuration = 1500;
    let time = 0;
    let logoAnimationProgress = 0;

    // Animation function
    function animate() {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / animationDuration, 1);
      time += 0.016;

      // Handle camera movement
      const moveSpeed = 0.5;
      if (keysRef.current['ArrowLeft']) {
        cameraRef.current.x -= moveSpeed;
      }
      if (keysRef.current['ArrowRight']) {
        cameraRef.current.x += moveSpeed;
      }
      if (keysRef.current['ArrowUp']) {
        cameraRef.current.y += moveSpeed;
      }
      if (keysRef.current['ArrowDown']) {
        cameraRef.current.y -= moveSpeed;
      }
      // Zoom controls with PageUp/PageDown
      if (keysRef.current['PageUp']) {
        cameraRef.current.z -= moveSpeed;
      }
      if (keysRef.current['PageDown']) {
        cameraRef.current.z += moveSpeed;
      }

      // Update camera position
      camera.position.set(cameraRef.current.x, cameraRef.current.y, cameraRef.current.z);
      camera.lookAt(scene.position);

      // Animate IPFS logo along the tree
      if (nodePositions.length > 0) {
        logoAnimationProgress = (logoAnimationProgress + 0.002) % 1;
        
        // Calculate current position in the path
        const pathIndex = Math.floor(logoAnimationProgress * (nodePositions.length - 1));
        const nextIndex = (pathIndex + 1) % nodePositions.length;
        const pathProgress = (logoAnimationProgress * (nodePositions.length - 1)) % 1;
        
        // Interpolate between current and next position
        const currentPos = nodePositions[pathIndex];
        const nextPos = nodePositions[nextIndex];
        
        ipfsSprite.position.lerpVectors(currentPos, nextPos, pathProgress);
        
        // Add floating motion
        ipfsSprite.position.y += Math.sin(time * 3) * 0.1;
        
        // Scale pulsing
        const scale = 1 + Math.sin(time * 4) * 0.2;
        ipfsSprite.scale.set(scale, scale, 1);
        
        // Fade opacity based on movement
        logoMaterial.opacity = 0.6 + Math.sin(time * 3) * 0.2;
      }

      // Update nodes with subtle pulse
      nodes.forEach((node, index) => {
        const nodeDelay = index < 3 ? 0.2 : index < 7 ? 0.4 : 0.6;
        const nodeProgress = Math.max(0, Math.min(1, (progress - nodeDelay) / (1 - nodeDelay)));
        const scale = nodeProgress * (1 + 0.05 * Math.sin(time * 3 + index));
        node.scale.set(scale, scale, scale);
        node.rotation.y = time * 0.5;
        
        // Pulse node opacity when IPFS logo is near
        if (ipfsSprite.position.distanceTo(node.position) < 2) {
          (node.material as THREE.MeshPhongMaterial).opacity = 0.5 + Math.sin(time * 5) * 0.3;
        } else {
          (node.material as THREE.MeshPhongMaterial).opacity = 0.9;
        }
      });

      // Rotate the entire scene slightly
      scene.rotation.y = Math.sin(time * 0.5) * 0.1;

      // Move point light in a circular pattern
      pointLight.position.x = Math.sin(time) * 10;
      pointLight.position.z = Math.cos(time) * 10;

      // Update connections
      createConnections();
      
      // Initial collection of node positions
      if (nodePositions.length === 0) {
        collectNodePositions();
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    // Start animation
    animate();

    // Handle window resize
    function handleResize() {
      if (!containerRef.current) return;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      window.removeEventListener('resize', handleResize);

      // Dispose of all geometries, materials, and textures
      nodes.forEach(node => {
        node.geometry.dispose();
        (node.material as THREE.Material).dispose();
      });

      lines.forEach(line => {
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
    };
  }, [isVisible, onAnimationComplete]);

  if (!isVisible) return null;

  return (
    <>
      <div 
        ref={containerRef} 
        className="fixed inset-0 z-50"
        style={{ 
          opacity: isAnimating ? 1 : 0,
          transition: 'opacity 0.5s ease-out',
          pointerEvents: isAnimating ? 'auto' : 'none'
        }}
      />
      
      {/* Close Button */}
      <button
        onClick={onAnimationComplete}
        className="fixed top-3 right-3 z-50 bg-gray-900 hover:bg-gray-800 text-white shadow-lg rounded-lg px-3 py-1.5 flex items-center space-x-2 transition-all duration-200 hover:-translate-y-0.5"
        style={{ 
          opacity: isAnimating ? 1 : 0,
          transition: 'opacity 0.5s ease-out'
        }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        <span className="font-mono text-xs">Close</span>
      </button>

      {/* Merkle Tree Explanation Overlay */}
      <div 
        className="fixed bottom-40 left-4 right-4 md:left-8 md:right-auto md:bottom-36 md:w-96 bg-white/95 backdrop-blur-lg rounded-xl shadow-xl p-4 md:p-6 z-50 border border-gray-200"
        style={{ 
          opacity: isAnimating ? 1 : 0,
          transition: 'all 0.5s ease-out',
          transform: isAnimating 
            ? 'translateY(0)' 
            : 'translateY(100%)'
        }}
      >
        <div className="space-y-3">
          {/* Step indicator */}
          <div className="flex space-x-1.5">
            {explanationSteps.map((_, index) => (
              <div 
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  index === currentStep ? 'bg-gray-900' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="min-h-[60px] md:min-h-[80px]">
            <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-2 font-mono">
              {explanationSteps[currentStep].title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {explanationSteps[currentStep].content}
            </p>
          </div>

          {/* Learn more link - shown on all devices */}
          <a 
            href="https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
          >
            Learn more
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 ml-1" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </div>

      {/* Controls Bar */}
      <div 
        className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-lg shadow-lg border-t border-gray-200 z-50 px-4 py-4"
        style={{ 
          opacity: isAnimating ? 1 : 0,
          transition: 'opacity 0.5s ease-out'
        }}
      >
        <div className="flex items-center justify-center max-w-lg mx-auto gap-8">
          <div className="flex-none">
            <div className="grid grid-cols-3 gap-1.5 w-[140px]">
              {/* D-pad controls */}
              <button 
                className={`col-start-2 h-10 ${activeControls.up ? 'bg-gray-200' : 'bg-gray-100'} active:bg-gray-200 rounded-lg flex items-center justify-center shadow-sm hover:bg-gray-200 transition-colors`}
                onMouseDown={() => startControl('up')}
                onMouseUp={() => stopControl('up')}
                onMouseLeave={() => stopControl('up')}
                onTouchStart={() => startControl('up')}
                onTouchEnd={() => stopControl('up')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              <button 
                className={`h-10 ${activeControls.left ? 'bg-gray-200' : 'bg-gray-100'} active:bg-gray-200 rounded-lg flex items-center justify-center shadow-sm hover:bg-gray-200 transition-colors`}
                onMouseDown={() => startControl('left')}
                onMouseUp={() => stopControl('left')}
                onMouseLeave={() => stopControl('left')}
                onTouchStart={() => startControl('left')}
                onTouchEnd={() => stopControl('left')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              <button 
                className={`h-10 ${activeControls.right ? 'bg-gray-200' : 'bg-gray-100'} active:bg-gray-200 rounded-lg flex items-center justify-center shadow-sm hover:bg-gray-200 transition-colors`}
                onMouseDown={() => startControl('right')}
                onMouseUp={() => stopControl('right')}
                onMouseLeave={() => stopControl('right')}
                onTouchStart={() => startControl('right')}
                onTouchEnd={() => stopControl('right')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              <button 
                className={`col-start-2 h-10 ${activeControls.down ? 'bg-gray-200' : 'bg-gray-100'} active:bg-gray-200 rounded-lg flex items-center justify-center shadow-sm hover:bg-gray-200 transition-colors`}
                onMouseDown={() => startControl('down')}
                onMouseUp={() => stopControl('down')}
                onMouseLeave={() => stopControl('down')}
                onTouchStart={() => startControl('down')}
                onTouchEnd={() => stopControl('down')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex flex-col gap-1.5">
            <button 
              className={`w-10 h-10 ${activeControls.zoomIn ? 'bg-gray-200' : 'bg-gray-100'} active:bg-gray-200 rounded-lg flex items-center justify-center shadow-sm hover:bg-gray-200 transition-colors`}
              onMouseDown={() => startControl('zoomIn')}
              onMouseUp={() => stopControl('zoomIn')}
              onMouseLeave={() => stopControl('zoomIn')}
              onTouchStart={() => startControl('zoomIn')}
              onTouchEnd={() => stopControl('zoomIn')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
            <button 
              className={`w-10 h-10 ${activeControls.zoomOut ? 'bg-gray-200' : 'bg-gray-100'} active:bg-gray-200 rounded-lg flex items-center justify-center shadow-sm hover:bg-gray-200 transition-colors`}
              onMouseDown={() => startControl('zoomOut')}
              onMouseUp={() => stopControl('zoomOut')}
              onMouseLeave={() => stopControl('zoomOut')}
              onTouchStart={() => startControl('zoomOut')}
              onTouchEnd={() => stopControl('zoomOut')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 