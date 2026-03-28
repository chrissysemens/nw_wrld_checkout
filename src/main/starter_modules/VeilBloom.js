/*
@nwWrld name: VeilBloom
@nwWrld category: 3D
@nwWrld imports: BaseThreeJsModule, THREE
*/

class VeilBloom extends BaseThreeJsModule {
  static methods = [
    ...BaseThreeJsModule.methods,
    {
      name: "sustain",
      executeOnLoad: true,
      options: [
        {
          name: "intensity",
          type: "number",
          defaultVal: 0.8,
          min: 0,
          max: 2,
          allowRandomization: true,
        },
      ],
    },
    {
      name: "shimmer",
      executeOnLoad: false,
      options: [
        {
          name: "amount",
          type: "number",
          defaultVal: 0.6,
          min: 0,
          max: 2,
        },
        {
          name: "duration",
          type: "number",
          defaultVal: 600,
          unit: "ms",
          min: 100,
          max: 4000,
        },
      ],
    },
    {
      name: "bloom",
      executeOnLoad: false,
      options: [
        {
          name: "scale",
          type: "number",
          defaultVal: 1.3,
          min: 1,
          max: 3,
        },
        {
          name: "duration",
          type: "number",
          defaultVal: 1200,
          unit: "ms",
          min: 300,
          max: 6000,
        },
      ],
    },
    {
      name: "reset",
      executeOnLoad: false,
      options: [],
    },
  ];

  constructor(container) {
    super(container);
    if (!THREE) return;

    this.moduleGroup = new THREE.Group();
    this.veilGroup = new THREE.Group();
    this.veilUniforms = [];
    this.veilBloomState = { timer: 0, duration: 0, scale: 1 };

    this.pollenGeometry = null;
    this.pollenMaterial = null;
    this.pollenSystem = null;
    this.pollenData = [];
    this.pollenIntensity = 0.8;

    this.shimmerState = { timer: 0, duration: 0, amount: 0 };

    this.animateLoop = this.animateLoop.bind(this);
    this.setCustomAnimate(this.animateLoop);

    this.init();
  }

  init() {
    if (!this.scene || !this.camera || !this.renderer) return;

    this.scene.background = new THREE.Color("#05070b");
    this.scene.fog = new THREE.FogExp2("#040507", 0.015);

    const hemi = new THREE.HemisphereLight(0xb4ceff, 0x0b0f15, 0.5);
    this.moduleGroup.add(hemi);
    const fill = new THREE.DirectionalLight(0xfff1d7, 0.4);
    fill.position.set(4, 6, 2);
    this.moduleGroup.add(fill);

    this.camera.position.set(0, 2.5, 14);

    this.buildVeils();
    this.createPollen();

    this.setModel(this.moduleGroup);
  }

  buildVeils() {
    const vertexShader = `
      uniform float uTime;
      uniform float uPhase;
      uniform float uShimmer;
      uniform float uBloom;
      varying vec2 vUv;
      float noise(vec3 p){
        return fract(sin(dot(p, vec3(12.9898,78.233,54.53))) * 43758.5453);
      }
      void main(){
        vUv = uv;
        vec3 pos = position;
        float wave = sin((uv.y + uPhase) * 6.283 + uTime * 0.15);
        float jitter = noise(vec3(uv * 6.0, uTime * 0.05)) - 0.5;
        pos.x += (wave * 0.8 + jitter * 0.4) * (1.0 + uBloom * 0.3);
        pos.z += sin((uv.x + uPhase) * 3.1415 + uTime * 0.1) * 0.6 * (1.0 + uShimmer);
        pos.y += jitter * 0.3;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const fragmentShader = `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform float uIntensity;
      varying vec2 vUv;
      void main(){
        float gradient = smoothstep(0.0, 1.0, vUv.y);
        vec3 color = mix(uColorA, uColorB, gradient);
        float alpha = 0.55 + 0.35 * sin(vUv.y * 3.1415);
        gl_FragColor = vec4(color * uIntensity, alpha);
      }
    `;

    const palette = [
      { a: "#1b2443", b: "#5dd6ff" },
      { a: "#2b1f46", b: "#f3a6ff" },
      { a: "#143a35", b: "#ffc87c" },
    ];

    const veilGeometry = new THREE.PlaneGeometry(6, 8, 32, 64);
    for (let i = 0; i < palette.length; i++) {
      const colors = palette[i];
      const uniforms = {
        uTime: { value: 0 },
        uPhase: { value: Math.random() * Math.PI * 2 },
        uShimmer: { value: 0 },
        uBloom: { value: 0 },
        uIntensity: { value: 0.8 },
        uColorA: { value: new THREE.Color(colors.a) },
        uColorB: { value: new THREE.Color(colors.b) },
      };

      const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(veilGeometry, material);
      mesh.position.z = -i * 1.5;
      mesh.rotation.y = THREE.MathUtils.degToRad(-6 + i * 6);
      this.veilGroup.add(mesh);
      this.veilUniforms.push(uniforms);
    }

    this.moduleGroup.add(this.veilGroup);
  }

  createPollen() {
    const count = 320;
    this.pollenGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 1] = Math.random() * 6 - 1.5;
      positions[i * 3 + 2] = Math.random() * -6;
      sizes[i] = Math.random() * 4 + 2;
      const hue = 0.1 + Math.random() * 0.15;
      const color = new THREE.Color().setHSL(hue, 0.6, 0.65);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      this.pollenData.push({ velocity: new THREE.Vector3(0, Math.random() * 0.4 + 0.1, 0), offset: Math.random() * Math.PI * 2 });
    }

    this.pollenGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.pollenGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    this.pollenGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const vertexShader = `
      attribute float size;
      uniform float uTime;
      varying vec3 vColor;
      void main(){
        vColor = color;
        vec3 pos = position;
        pos.x += sin(uTime * 0.1 + pos.z * 0.5) * 0.4;
        pos.z += cos(uTime * 0.08 + pos.x * 0.3) * 0.4;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (200.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    const fragmentShader = `
      varying vec3 vColor;
      void main(){
        float d = length(gl_PointCoord - vec2(0.5));
        if(d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor, alpha);
      }
    `;

    this.pollenMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
      },
    });

    this.pollenSystem = new THREE.Points(this.pollenGeometry, this.pollenMaterial);
    this.moduleGroup.add(this.pollenSystem);
  }

  animateLoop(delta) {
    const time = performance.now() / 1000;
    this.updateVeils(delta, time);
    this.updatePollen(delta, time);
  }

  updateVeils(delta, time) {
    const shimmerActive = this.shimmerState.duration > 0 ? Math.max(0, 1 - this.shimmerState.timer / this.shimmerState.duration) : 0;
    const bloomActive = this.veilBloomState.duration > 0 ? Math.max(0, 1 - this.veilBloomState.timer / this.veilBloomState.duration) : 0;

    this.shimmerState.timer += delta * 1000;
    this.veilBloomState.timer += delta * 1000;

    const bloomScale = 1 + bloomActive * (this.veilBloomState.scale - 1);
    this.veilGroup.scale.set(bloomScale, bloomScale, bloomScale);

    this.veilUniforms.forEach((uniforms) => {
      uniforms.uTime.value = time;
      uniforms.uShimmer.value = shimmerActive * this.shimmerState.amount;
      uniforms.uBloom.value = bloomActive * 0.8;
      uniforms.uIntensity.value = THREE.MathUtils.lerp(uniforms.uIntensity.value, this.baseIntensity || 0.8, delta * 2);
    });

    if (this.veilBloomState.timer >= this.veilBloomState.duration) {
      this.veilBloomState.duration = 0;
    }
    if (this.shimmerState.timer >= this.shimmerState.duration) {
      this.shimmerState.duration = 0;
    }
  }

  updatePollen(delta, time) {
    if (!this.pollenGeometry) return;
    const positions = this.pollenGeometry.attributes.position.array;
    for (let i = 0; i < this.pollenData.length; i++) {
      const datum = this.pollenData[i];
      const idx = i * 3;
      positions[idx + 1] += datum.velocity.y * delta * (0.5 + this.pollenIntensity);
      positions[idx + 1] = ((positions[idx + 1] + 5) % 8) - 2;
      positions[idx] += Math.sin(time * 0.2 + datum.offset) * 0.05;
      positions[idx + 2] += Math.cos(time * 0.18 + datum.offset) * 0.05;
    }
    this.pollenGeometry.attributes.position.needsUpdate = true;
    if (this.pollenMaterial?.uniforms?.uTime) {
      this.pollenMaterial.uniforms.uTime.value = time;
    }
  }

  sustain({ intensity = 0.8 } = {}) {
    this.baseIntensity = THREE.MathUtils.clamp(Number(intensity) || 0.8, 0, 2);
    this.pollenIntensity = this.baseIntensity;
  }

  shimmer({ amount = 0.6, duration = 600 } = {}) {
    this.shimmerState.amount = amount;
    this.shimmerState.duration = Math.max(100, duration);
    this.shimmerState.timer = 0;
  }

  bloom({ scale = 1.3, duration = 1200 } = {}) {
    this.veilBloomState.scale = Math.max(1, scale);
    this.veilBloomState.duration = Math.max(300, duration);
    this.veilBloomState.timer = 0;
  }

  reset() {
    this.baseIntensity = 0.8;
    this.pollenIntensity = 0.8;
    this.shimmerState.duration = 0;
    this.veilBloomState.duration = 0;
    this.veilGroup.scale.set(1, 1, 1);
  }

  destroy() {
    if (this.veilGroup) {
      this.moduleGroup?.remove(this.veilGroup);
      this.veilGroup.children.forEach((mesh) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
      this.veilGroup = null;
      this.veilUniforms = [];
    }
    if (this.pollenSystem) {
      this.moduleGroup?.remove(this.pollenSystem);
      this.pollenGeometry?.dispose();
      this.pollenMaterial?.dispose();
      this.pollenSystem = null;
    }
    if (this.moduleGroup) {
      this.moduleGroup.clear();
      this.moduleGroup = null;
    }
    super.destroy();
  }
}

export default VeilBloom;
