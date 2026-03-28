/*
@nwWrld name: Circle
@nwWrld category: 3D
@nwWrld imports: BaseThreeJsModule, THREE
*/

class Circle extends BaseThreeJsModule {
  static category = "3D";
  static methods = [
    ...BaseThreeJsModule.methods,
    {
      name: "thump",
      executeOnLoad: false,
      options: [
        {
          name: "intensity",
          type: "number",
          defaultVal: 1,
          min: 0.1,
          max: 3,
          allowRandomization: true,
        },
        {
          name: "duration",
          type: "number",
          defaultVal: 240,
          min: 60,
          max: 2000,
          unit: "ms",
        },
      ],
    },
  ];

  constructor(container) {
    super(container);
    if (!THREE) return;

    this.circleGroup = new THREE.Group();
    this.circleMesh = null;
    this.baseScale = 1;
    this.pulse = { duration: 0, elapsed: 0, amount: 0 };
    this.lastTime = performance.now();

    this.animateLoop = this.animateLoop.bind(this);
    this.setCustomAnimate(this.animateLoop);

    this.init();
  }

  init() {
    if (this.destroyed) return;
    const geometry = new THREE.CircleGeometry(3, 96);
    const material = new THREE.MeshBasicMaterial({
      color: "#3dd5ff",
      transparent: true,
      opacity: 0.9,
    });
    this.circleMesh = new THREE.Mesh(geometry, material);
    this.circleMesh.rotation.x = -Math.PI / 2;
    this.circleMesh.scale.set(this.baseScale, this.baseScale, this.baseScale);

    const outlineGeometry = new THREE.RingGeometry(3.1, 3.35, 64);
    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0.3,
    });
    this.outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
    this.outlineMesh.rotation.x = -Math.PI / 2;

    this.circleGroup.add(this.circleMesh);
    this.circleGroup.add(this.outlineMesh);

    this.setModel(this.circleGroup);
  }

  animateLoop() {
    if (!this.circleMesh) return;
    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    if (this.pulse.duration > 0) {
      this.pulse.elapsed += dt * 1000;
      const progress = Math.min(1, this.pulse.elapsed / this.pulse.duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      const scale = this.baseScale + this.pulse.amount * (1 - ease);
      this.circleMesh.scale.set(scale, scale, scale);
      this.outlineMesh.scale.set(scale * 1.02, scale * 1.02, scale * 1.02);
      if (progress >= 1) {
        this.pulse.duration = 0;
        this.circleMesh.scale.set(this.baseScale, this.baseScale, this.baseScale);
        this.outlineMesh.scale.set(this.baseScale * 1.02, this.baseScale * 1.02, this.baseScale * 1.02);
      }
    }
  }

  thump({ intensity = 1, duration = 240 } = {}) {
    const clampedIntensity = Math.max(0.1, Math.min(3, Number(intensity) || 1));
    const clampedDuration = Math.max(60, Number(duration) || 240);
    this.pulse = {
      amount: clampedIntensity * 0.6,
      duration: clampedDuration,
      elapsed: 0,
    };
  }

  destroy() {
    this.circleGroup = null;
    this.circleMesh = null;
    this.outlineMesh = null;
    super.destroy();
  }
}

export default Circle;
