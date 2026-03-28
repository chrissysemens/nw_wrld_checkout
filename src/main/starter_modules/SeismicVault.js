/*
@nwWrld name: SeismicVault
@nwWrld category: 3D
@nwWrld imports: BaseThreeJsModule, THREE
*/

class SeismicVault extends BaseThreeJsModule {
  static methods = [
    ...BaseThreeJsModule.methods,
    {
      name: "impact",
      executeOnLoad: false,
      options: [
        {
          name: "intensity",
          defaultVal: 1.0,
          type: "number",
          min: 0.2,
          max: 3,
          allowRandomization: true,
        },
      ],
    },
    {
      name: "strobe",
      executeOnLoad: false,
      options: [
        {
          name: "mode",
          defaultVal: "white",
          type: "select",
          values: ["white", "crimson"],
        },
        {
          name: "duration",
          defaultVal: 180,
          type: "number",
          unit: "ms",
          min: 50,
          max: 2000,
        },
      ],
    },
    {
      name: "crack",
      executeOnLoad: false,
      options: [
        {
          name: "duration",
          defaultVal: 600,
          type: "number",
          unit: "ms",
          min: 100,
          max: 2000,
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

    this.ribCount = 18;
    this.ribs = [];
    this.ribTargets = [];
    this.ribGroup = new THREE.Group();

    this.dustCount = 180;
    this.dustGeometry = null;
    this.dustMaterial = null;
    this.dustSystem = null;
    this.dustData = [];

    this.strobeLight = null;
    this.strobeTimer = 0;
    this.strobeDuration = 0;

    this.crackMesh = null;
    this.crackTimer = 0;
    this.crackDuration = 0;

    this.animateLoop = this.animateLoop.bind(this);
    this.setCustomAnimate(this.animateLoop);

    this.init();
  }

  init() {
    if (!this.scene || !this.camera || !this.renderer) return;

    this.scene.background = new THREE.Color("#050505");
    this.scene.fog = new THREE.FogExp2("#040404", 0.03);

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(-4, 8, 10);
    this.scene.add(rimLight);

    this.camera.position.set(0, 4, 18);

    this.buildVault();
    this.createDustSystem();
    this.createStrobe();
    this.createCrackMesh();
  }

  buildVault() {
    const ribGeometry = new THREE.BoxGeometry(0.6, 6, 2.5);
    const ribMaterial = new THREE.MeshStandardMaterial({
      color: "#111111",
      emissive: "#050505",
      metalness: 0.2,
      roughness: 0.7,
    });

    for (let i = 0; i < this.ribCount; i++) {
      const rib = new THREE.Mesh(ribGeometry, ribMaterial.clone());
      const angle = (i / this.ribCount) * Math.PI - Math.PI / 2;
      const radius = 4 + Math.abs(Math.sin(angle) * 2.5);
      rib.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius * 0.5);
      rib.rotation.y = angle;
      this.ribGroup.add(rib);
      this.ribs.push(rib);
      this.ribTargets.push({ offset: 0, velocity: 0 });
    }

    this.scene.add(this.ribGroup);

    const floorGeometry = new THREE.PlaneGeometry(30, 30);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: "#050505",
      roughness: 0.9,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3.2;
    this.scene.add(floor);
  }

  createDustSystem() {
    this.dustGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.dustCount * 3);
    const colors = new Float32Array(this.dustCount * 3);
    const sizes = new Float32Array(this.dustCount);

    for (let i = 0; i < this.dustCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -999;
      positions[i * 3 + 2] = 0;
      colors[i * 3] = 0.8;
      colors[i * 3 + 1] = 0.5;
      colors[i * 3 + 2] = 0.3;
      sizes[i] = 0;
      this.dustData.push({ life: 0, velocity: new THREE.Vector3() });
    }

    this.dustGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.dustGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    this.dustGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const vertexShader = `
      attribute float size;
      varying vec3 vColor;
      void main(){
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (250.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      varying vec3 vColor;
      void main(){
        float d = length(gl_PointCoord - vec2(0.5));
        if(d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor, alpha * 0.8);
      }
    `;

    this.dustMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.dustSystem = new THREE.Points(this.dustGeometry, this.dustMaterial);
    this.scene.add(this.dustSystem);
  }

  createStrobe() {
    this.strobeLight = new THREE.SpotLight(0xffffff, 0, 30, Math.PI / 4, 0.5, 1.5);
    this.strobeLight.position.set(0, 6, 4);
    this.scene.add(this.strobeLight);
  }

  createCrackMesh() {
    const geometry = new THREE.PlaneGeometry(0.3, 12, 1, 20);
    const material = new THREE.MeshBasicMaterial({
      color: "#ff3c2f",
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    this.crackMesh = new THREE.Mesh(geometry, material);
    this.crackMesh.rotation.x = -Math.PI / 2;
    this.crackMesh.position.set(0, -3.19, 0);
    this.scene.add(this.crackMesh);
  }

  animateLoop(delta) {
    this.updateRibs(delta);
    this.updateDust(delta);
    this.updateStrobe(delta);
    this.updateCrack(delta);
  }

  updateRibs(delta) {
    for (let i = 0; i < this.ribCount; i++) {
      const target = this.ribTargets[i];
      if (!target) continue;
      target.velocity += (-target.offset) * 25 * delta;
      target.velocity *= 0.8;
      target.offset += target.velocity * delta;

      const rib = this.ribs[i];
      if (!rib) continue;
      rib.scale.z = 1 + target.offset;
      rib.material.emissiveIntensity = Math.max(0, target.offset * 4);
    }
  }

  updateDust(delta) {
    const positions = this.dustGeometry.attributes.position.array;
    const sizes = this.dustGeometry.attributes.size.array;
    for (let i = 0; i < this.dustCount; i++) {
      const data = this.dustData[i];
      if (data.life <= 0) {
        sizes[i] = 0;
        continue;
      }
      data.life -= delta * 1000;
      const idx = i * 3;
      positions[idx] += data.velocity.x * delta;
      positions[idx + 1] += data.velocity.y * delta;
      positions[idx + 2] += data.velocity.z * delta;
      data.velocity.y -= 9.81 * delta * 0.2;
      data.velocity.multiplyScalar(0.96);
      sizes[i] = Math.max(0, sizes[i] - delta * 20);
    }
    this.dustGeometry.attributes.position.needsUpdate = true;
    this.dustGeometry.attributes.size.needsUpdate = true;
  }

  updateStrobe(delta) {
    if (!this.strobeLight || this.strobeDuration <= 0) return;
    this.strobeTimer += delta * 1000;
    const progress = this.strobeTimer / this.strobeDuration;
    if (progress >= 1) {
      this.strobeLight.intensity = 0;
      this.strobeDuration = 0;
      return;
    }
    const falloff = Math.exp(-5 * progress);
    this.strobeLight.intensity = 12 * falloff;
  }

  updateCrack(delta) {
    if (!this.crackMesh || this.crackDuration <= 0) return;
    this.crackTimer += delta * 1000;
    const progress = this.crackTimer / this.crackDuration;
    if (progress >= 1) {
      this.crackMesh.material.opacity = 0;
      this.crackDuration = 0;
      return;
    }
    this.crackMesh.material.opacity = Math.sin(progress * Math.PI) * 0.8;
  }

  impact({ intensity = 1.0 } = {}) {
    const clamped = Math.max(0.2, Math.min(3, Number(intensity) || 1));
    for (let i = 0; i < this.ribCount; i++) {
      this.ribTargets[i].velocity -= clamped * 0.8;
    }
    this.emitDust(clamped);
  }

  strobe({ mode = "white", duration = 180 } = {}) {
    if (!this.strobeLight) return;
    const color = mode === "crimson" ? new THREE.Color("#ff3c2f") : new THREE.Color("#ffffff");
    this.strobeLight.color.copy(color);
    this.strobeDuration = Math.max(50, duration);
    this.strobeTimer = 0;
    this.strobeLight.intensity = 12;
  }

  crack({ duration = 600 } = {}) {
    if (!this.crackMesh) return;
    this.crackDuration = Math.max(100, duration);
    this.crackTimer = 0;
    this.crackMesh.material.opacity = 0.8;
  }

  emitDust(intensity) {
    for (let spawned = 0; spawned < 24; spawned++) {
      const slot = this.findDustSlot();
      if (slot === -1) break;
      const idx = slot * 3;
      const positions = this.dustGeometry.attributes.position.array;
      positions[idx] = (Math.random() - 0.5) * 4;
      positions[idx + 1] = -2.6;
      positions[idx + 2] = (Math.random() - 0.5) * 4;
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 6 * intensity,
        randomBetween(3, 6) * intensity,
        (Math.random() - 0.5) * 6 * intensity
      );
      this.dustData[slot] = {
        life: 600 + Math.random() * 600,
        velocity,
      };
      const sizes = this.dustGeometry.attributes.size.array;
      sizes[slot] = 6 + Math.random() * 8;
    }
    this.dustGeometry.attributes.position.needsUpdate = true;
    this.dustGeometry.attributes.size.needsUpdate = true;
  }

  findDustSlot() {
    for (let i = 0; i < this.dustCount; i++) {
      if (this.dustData[i].life <= 0) return i;
    }
    return -1;
  }

  reset() {
    for (let i = 0; i < this.ribCount; i++) {
      this.ribTargets[i].offset = 0;
      this.ribTargets[i].velocity = 0;
      if (this.ribs[i]) {
        this.ribs[i].scale.z = 1;
        this.ribs[i].material.emissiveIntensity = 0;
      }
    }
    this.dustData.forEach((d) => (d.life = 0));
    this.dustGeometry.attributes.size.array.fill(0);
    this.dustGeometry.attributes.size.needsUpdate = true;
    if (this.crackMesh) this.crackMesh.material.opacity = 0;
    if (this.strobeLight) this.strobeLight.intensity = 0;
  }

  destroy() {
    if (this.dustSystem) {
      this.scene.remove(this.dustSystem);
      this.dustGeometry?.dispose();
      this.dustMaterial?.dispose();
      this.dustSystem = null;
    }
    if (this.ribGroup) {
      this.scene.remove(this.ribGroup);
      this.ribs.forEach((rib) => {
        if (rib) {
          rib.geometry.dispose();
          rib.material.dispose();
        }
      });
      this.ribs = [];
    }
    if (this.crackMesh) {
      this.scene.remove(this.crackMesh);
      this.crackMesh.geometry.dispose();
      this.crackMesh.material.dispose();
      this.crackMesh = null;
    }
    if (this.strobeLight) {
      this.scene.remove(this.strobeLight);
      this.strobeLight = null;
    }
    super.destroy();
  }
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

export default SeismicVault;
