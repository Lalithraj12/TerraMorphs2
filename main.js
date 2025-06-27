import * as THREE from "https://unpkg.com/three@0.157.0/build/three.module.js";

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// === Mini Map UI ===
const mapUI = document.createElement('div');
mapUI.id = 'lab-map';
mapUI.style.position = 'fixed';
mapUI.style.bottom = '10px';
mapUI.style.right = '10px';
mapUI.style.width = '180px';
mapUI.style.height = '180px';
mapUI.style.background = 'rgba(0, 0, 0, 0.5)';
mapUI.style.border = '2px solid lime';
mapUI.style.zIndex = 999;
mapUI.style.fontFamily = 'monospace';
mapUI.style.color = '#0f0';
mapUI.style.fontSize = '12px';
mapUI.style.overflow = 'hidden';
mapUI.style.padding = '6px';
mapUI.innerHTML = '<strong>🧭 Lab Map</strong><br><canvas id="mapCanvas" width="160" height="140" style="margin-top:5px;background:#111;border:1px solid #0f0;"></canvas>';
document.body.appendChild(mapUI);

const mapCanvas = document.getElementById('mapCanvas');
const mapCtx = mapCanvas.getContext('2d');

let keys = {}, yaw = 0, pitch = 0;
let dogState = "follow";
const walkSound = new Audio("sounds/walk.mp3");
walkSound.loop = true;
walkSound.volume = 0.3;
const clickableObjects = [], raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2();

let scientist = new THREE.Group();
scientist.name = "scientist";
scientist.position.set(0, 0, 0);

const bodyMat = new THREE.MeshStandardMaterial({ color: 0x66aaff, metalness: 0.6, roughness: 0.1 });
const limbMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.4, roughness: 0.3 });
const headMat = new THREE.MeshStandardMaterial({ color: 0xfff6e0, emissive: 0xffcc99, emissiveIntensity: 0.4 });

const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 32), headMat);
head.position.set(0, 1.6, 0);
scientist.add(head);

const coatMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.4, roughness: 0.3 });
const coat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.2, 0.35), coatMat);
coat.position.set(0, 0.8, 0);
scientist.add(coat);

const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.1, 0.25), bodyMat);
torso.position.set(0, 0.8, 0);
scientist.add(torso);

const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.6, 0.15), bodyMat);
leftArm.position.set(-0.4, 1.1, 0);
leftArm.name = "leftArm";
scientist.add(leftArm);

const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.6, 0.15), bodyMat);
rightArm.position.set(0.4, 1.1, 0);
rightArm.name = "rightArm";
scientist.add(rightArm);

const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), limbMat);
leftLeg.position.set(-0.15, 0.3, 0);
leftLeg.name = "leftLeg";
scientist.add(leftLeg);

const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), limbMat);
rightLeg.position.set(0.15, 0.3, 0);
rightLeg.name = "rightLeg";
scientist.add(rightLeg);

scene.add(scientist);

const dog = new THREE.Group();
const dogBody = new THREE.Mesh(
  new THREE.BoxGeometry(0.6, 0.3, 1),
  new THREE.MeshStandardMaterial({ color: 0x4444ff }));
dogBody.position.set(0, 0.3, 0);
dog.add(dogBody);

const dogHead = new THREE.Mesh(
  new THREE.BoxGeometry(0.3, 0.3, 0.3),
  new THREE.MeshStandardMaterial({ color: 0x6666ff }));
dogHead.position.set(0, 0.35, 0.65);
dog.add(dogHead);
const dogTail = new THREE.Mesh(
  new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8),
  new THREE.MeshStandardMaterial({ color: 0x8888ff }));
dogTail.rotation.z = Math.PI / 2;
dogTail.position.set(0, 0.35, -0.6);
dog.add(dogTail);
dog.add(dogHead);

const dogLegMat = new THREE.MeshStandardMaterial({ color: 0x333388 });
for (let x of [-0.2, 0.2]) {
  for (let z of [-0.35, 0.35]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8), dogLegMat);
    leg.position.set(x, 0.15, z);
    dog.add(leg);
  }}
dog.position.set(1, 0, 0);
scene.add(dog);

const floorTileSize = 2;
const floorTileCount = 40;
for (let i = -floorTileCount / 2; i < floorTileCount / 2; i++) {
  for (let j = -floorTileCount / 2; j < floorTileCount / 2; j++) {
    const tileColor = (i + j) % 2 === 0 ? 0x88aaff : 0xaaddff;
    const tile = new THREE.Mesh(
      new THREE.PlaneGeometry(floorTileSize, floorTileSize),
      new THREE.MeshStandardMaterial({ color: tileColor })
    );
    tile.rotation.x = -Math.PI / 2;
    tile.position.set(i * floorTileSize, 0, j * floorTileSize);
    scene.add(tile);
  }
}

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const light = new THREE.DirectionalLight(0xffffff, 0.4);
light.position.set(5, 10, 5);
scene.add(light);


document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === "1") {
    dogState = "sit";
  } else if (e.key === "2" && dogState !== "jumping") {
    dogState = "jumping";
    new TWEEN.Tween(dog.position)
      .to({ y: dog.position.y + 1 }, 300)
      .easing(TWEEN.Easing.Quadratic.Out)
      .yoyo(true)
      .repeat(1)
      .onComplete(() => { dogState = "follow"; })
      .start();
  }
});
document.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

function animate() {
  const overlay = document.getElementById('simulation-overlay');
  const aiCoreBox = new THREE.Box3().setFromObject(aiCore);
  const inAICore = aiCoreBox.containsPoint(scientist.position);

  if (inAICore && !overlay) {
    showFullScreenSimulation('Lab Control Dashboard');
  } else if (!inAICore && overlay) {
    overlay.remove();
  }
  if (aiCoreBox.containsPoint(scientist.position)) {
    const existing = document.getElementById('simulation-overlay');
    if (!existing) showFullScreenSimulation('Lab Control Dashboard');
  }
  updateDog();
  const roomCollisionBoxes = [];
  scene.traverse(obj => {
    if (obj.geometry instanceof THREE.BoxGeometry && obj.material?.color?.getHex && obj.material?.opacity > 0.1) {
      obj.updateMatrixWorld();
      const box = new THREE.Box3().setFromObject(obj);
      roomCollisionBoxes.push(box);
    }
  });
  requestAnimationFrame(animate);
  
  scene.traverse(obj => {
    if (obj.name.startsWith("door_") && obj.material?.transparent) {
      const distance = scientist.position.distanceTo(obj.position);
      if (distance < 3) {
        obj.material.opacity = 0.1;
        obj.material.emissive = new THREE.Color(0x00ffff);
        obj.material.emissiveIntensity = 1;
      } else {
        obj.material.opacity = 1;
        obj.material.emissive = new THREE.Color(0x000000);
        obj.material.emissiveIntensity = 0;
      }
    }
  });

  const speed = 0.05;
  let moved = false;

  if (keys["w"]) {
    const newPosW = scientist.position.clone().add(new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)).multiplyScalar(speed));
    if (!roomCollisionBoxes.some(box => box.containsPoint(newPosW))) {
      scientist.position.copy(newPosW);
    }
    moved = true;
  }
  if (keys["s"]) {
    const newPosS = scientist.position.clone().add(new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(speed));
    if (!roomCollisionBoxes.some(box => box.containsPoint(newPosS))) {
      scientist.position.copy(newPosS);
    }
    moved = true;
  }
  if (keys["a"]) {
    scientist.position.x -= Math.cos(yaw) * speed;
    const newPosA = scientist.position.clone().add(new THREE.Vector3(-Math.cos(yaw), 0, Math.sin(yaw)).multiplyScalar(speed));
    if (!roomCollisionBoxes.some(box => box.containsPoint(newPosA))) {
      scientist.position.copy(newPosA);
    }
    moved = true;
  }
  if (keys["d"]) {
    scientist.position.x += Math.cos(yaw) * speed;
    const newPosD = scientist.position.clone().add(new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)).multiplyScalar(speed));
    if (!roomCollisionBoxes.some(box => box.containsPoint(newPosD))) {
      scientist.position.copy(newPosD);
    }
    moved = true;
  }

  const time = Date.now() * 0.005;
  const walkCycle = Math.sin(time * 5) * 0.5;
  if (moved) {
    if (walkSound.paused) walkSound.play().catch(() => {});
    scientist.getObjectByName("leftLeg").rotation.x = walkCycle;
    scientist.getObjectByName("rightLeg").rotation.x = -walkCycle;
    scientist.getObjectByName("leftArm").rotation.x = -walkCycle;
    scientist.getObjectByName("rightArm").rotation.x = walkCycle;
  } else {
    if (!walkSound.paused) walkSound.pause();
    scientist.getObjectByName("leftLeg").rotation.x = 0;
    scientist.getObjectByName("rightLeg").rotation.x = 0;
    scientist.getObjectByName("leftArm").rotation.x = 0;
    scientist.getObjectByName("rightArm").rotation.x = 0;
  }

  const lookDirection = new THREE.Vector3(
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    Math.cos(yaw) * Math.cos(pitch)
  );
  const cameraTarget = scientist.position.clone().add(lookDirection);
  camera.position.copy(scientist.position.clone().add(new THREE.Vector3(0, 2, 5).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw)));
  camera.lookAt(cameraTarget);

  TWEEN.update();
  renderer.render(scene, camera);

// === UPDATE MINI MAP ===
mapCtx.clearRect(0, 0, 160, 140);
mapCtx.fillStyle = '#0f0';
const scale = 2;
const centerX = 80, centerY = 70;
const px = centerX + scientist.position.x * scale;
const pz = centerY + scientist.position.z * scale;
mapCtx.beginPath();
mapCtx.arc(px, pz, 4, 0, Math.PI * 2);
mapCtx.fill();
mapCtx.fillText("You", px + 5, pz + 5);

// === Add room markers ===
const roomLabels = [
  { x: 0, z: 14, label: 'GE' },
  { x: 0, z: -14, label: 'BA' },
  { x: -14, z: 0, label: 'CS' },
  { x: 14, z: 0, label: 'SC' },
  { x: -18, z: 18, label: 'AR' },
  { x: 18, z: -18, label: 'BF' },
  { x: -18, z: -18, label: 'TS' },
  { x: 18, z: 18, label: 'QS' }
];
mapCtx.fillStyle = '#ff0';
for (const room of roomLabels) {
  const rx = centerX + room.x * scale;
  const rz = centerY + room.z * scale;
  mapCtx.fillRect(rx - 2, rz - 2, 4, 4);
  mapCtx.fillText(room.label, rx + 5, rz + 5);
}
}

function updateDog() {
  const offset = new THREE.Vector3(2, 0, 0);
  offset.applyQuaternion(scientist.quaternion);
  if (dogState === "follow") {
    dog.position.copy(scientist.position.clone().add(offset));
  } else if (dogState === "sit") {
    dog.position.copy(scientist.position.clone().add(offset));
    dog.position.y = 0.1;
  }
  dog.lookAt(scientist.position);

  if (dogState === "follow" && (keys["w"] || keys["a"] || keys["s"] || keys["d"])) {
    const time = Date.now() * 0.005;
    const walkCycle = Math.sin(time * 10) * 0.3;
    let i = 0;
    for (let child of dog.children) {
      if (child.geometry?.type === 'CylinderGeometry') {
        child.rotation.x = (i % 2 === 0 ? walkCycle : -walkCycle);
        i++;
      }
    }
  } else {
    for (let child of dog.children) {
      if (child.geometry?.type === 'CylinderGeometry') {
        child.rotation.x = 0;
      }
    }
  }}

let mouseDown = false;
renderer.domElement.addEventListener("mousedown", () => mouseDown = true);
renderer.domElement.addEventListener("mouseup", () => mouseDown = false);

renderer.domElement.addEventListener("mousemove", (event) => {
  if (!mouseDown) return;
  yaw -= event.movementX * 0.002;
  pitch -= event.movementY * 0.002;
  pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
});

renderer.domElement.addEventListener("click", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableObjects);
  if (intersects.length > 0) {
  let intersectedObject = intersects[0].object;
  while (intersectedObject.parent && !intersectedObject.userData?.onClick && intersectedObject !== scene) {
    intersectedObject = intersectedObject.parent;
  }
  const distance = scientist.position.distanceTo(intersectedObject.getWorldPosition(new THREE.Vector3()));
  if (distance <= 2 && intersectedObject.userData?.onClick) {
    intersectedObject.userData.onClick();
  }
}
  if (intersects.length > 0) {
    const equipment = intersects[0].object;
    const equipmentPos = equipment.getWorldPosition(new THREE.Vector3());
    const distance = scientist.position.distanceTo(equipmentPos);
    if (distance > 2) {
      const msg = document.createElement('div');
      msg.textContent = 'Move closer to interact';
      msg.style.position = 'absolute';
      msg.style.top = '50%';
      msg.style.left = '50%';
      msg.style.transform = 'translate(-50%, -50%)';
      msg.style.color = '#fff';
      msg.style.background = '#000';
      msg.style.padding = '10px';
      msg.style.border = '1px solid #0f0';
      msg.style.fontFamily = 'monospace';
      msg.style.zIndex = '100';
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 1500);
      return;
    }
    if (equipment.name.startsWith('button_')) {
      const door = equipment.userData.door;
      if (!door.userData.isOpen) {
        new TWEEN.Tween(door.material)
          .to({ opacity: 0 }, 1000)
          .easing(TWEEN.Easing.Quadratic.Out)
          .start();
        door.userData.isOpen = true;
      } else {
        new TWEEN.Tween(door.material)
          .to({ opacity: 1 }, 1000)
          .easing(TWEEN.Easing.Quadratic.Out)
          .start();
        door.userData.isOpen = false;
      }
      return;
    }
    if (equipment.name && !equipment.name.startsWith('door_') && !equipment.name.startsWith('button_')) {
      showFullScreenSimulation(equipment.name);
    }
  }
  });

function createEquipmentRoom(x, z, color, name) {
  const roomColorMap = {
    'Genome Editor': 0xaa00aa,
    'Biome Analyzer': 0x00cccc,
    'Cryo Storage': 0x3366ff,
    'Synthesis Console': 0xffff66
  };
  const colorCode = roomColorMap[name] || 0x222233;
  const width = 8, depth = 8, height = 6;
  const room = new THREE.Group();

  const back = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.2), new THREE.MeshStandardMaterial({ color: colorCode, emissive: colorCode, emissiveIntensity: 0.3 }));
  back.position.set(x, height / 2, z - depth / 2);
  room.add(back);

  const left = new THREE.Mesh(new THREE.BoxGeometry(0.2, height, depth), new THREE.MeshStandardMaterial({ color: colorCode }));
  left.position.set(x - width / 2, height / 2, z);
  room.add(left);

  const right = new THREE.Mesh(new THREE.BoxGeometry(0.2, height, depth), new THREE.MeshStandardMaterial({ color: colorCode }));
  right.position.set(x + width / 2, height / 2, z);
  room.add(right);
  
  const doorwayWidth = width * 0.4;
  const wallWidth = (width - doorwayWidth) / 2;

  const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(wallWidth, height, 0.2), new THREE.MeshStandardMaterial({ color: colorCode }));
  frontLeft.position.set(x - (doorwayWidth / 2 + wallWidth / 2), height / 2, z + depth / 2);
  room.add(frontLeft);

  const frontRight = new THREE.Mesh(new THREE.BoxGeometry(wallWidth, height, 0.2), new THREE.MeshStandardMaterial({ color: colorCode }));
  frontRight.position.set(x + (doorwayWidth / 2 + wallWidth / 2), height / 2, z + depth / 2);
  room.add(frontRight);

  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(width, 0.2, depth), new THREE.MeshStandardMaterial({ color: colorCode }));
  ceiling.position.set(x, height, z);
  room.add(ceiling);

  const equipment = createEquipment(x, z, color, name);
  room.add(equipment);

  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 256;
  labelCanvas.height = 64;
  const ctx = labelCanvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = 'lime';
  ctx.font = '24px monospace';
  ctx.fillText(name, 10, 40);

  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  const labelMat = new THREE.SpriteMaterial({ map: labelTexture });
  const labelSprite = new THREE.Sprite(labelMat);
  labelSprite.scale.set(3, 0.75, 1);
  labelSprite.position.set(x, height + 0.5, z + depth / 2 + 0.1);
  room.add(labelSprite);
  
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(doorwayWidth, height - 1, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.4 })
  );
  door.position.set(x, (height - 1) / 2, z + depth / 2);
  door.name = `door_${name}`;
  door.userData = { isOpen: false }; door.material.transparent = true; door.material.opacity = 1;
  room.add(door);

  const button = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00 })
  );
  button.position.set(x + doorwayWidth / 2 + 0.4, 1.5, z + depth / 2 + 0.05);
  button.name = `button_${name}`;
  button.userData = { door }; 
  clickableObjects.push(button);
  room.add(button);

  clickableObjects.push(door);

  clickableObjects.push(door);
  
  scene.add(room);
}
// Fullscreen Equipment Interface
const equipmentInterface = document.createElement('div');
equipmentInterface.style.position = 'fixed';
equipmentInterface.style.top = '0';
equipmentInterface.style.left = '0';
equipmentInterface.style.width = '100vw';
equipmentInterface.style.height = '100vh';
equipmentInterface.style.background = 'rgba(0, 0, 0, 0.85)';
equipmentInterface.style.color = 'white';
equipmentInterface.style.display = 'flex';
equipmentInterface.style.justifyContent = 'center';
equipmentInterface.style.alignItems = 'center';
equipmentInterface.style.fontSize = '2em';
equipmentInterface.style.zIndex = '999';
equipmentInterface.style.display = 'none';
equipmentInterface.innerText = 'This interface will be updated soon';
document.body.appendChild(equipmentInterface);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') equipmentInterface.style.display = 'none';
});

function createEquipment(x, z, color, name) {
  const group = new THREE.Group();
  let base;
  if (name === "Genome Editor") {
    base = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.8),
      new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.3, emissive: 0x330033 })
    );
  } else if (name === "Biome Analyzer") {
    base = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.5, 0.2, 100, 16),
      new THREE.MeshStandardMaterial({ color, emissive: 0x004400 })
    );
  } else if (name === "Cryo Storage") {
    base = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1.2, 1),
      new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.2 })
    );
  } else if (name === "Synthesis Console") {
    base = new THREE.Mesh(
      new THREE.ConeGeometry(0.8, 1.5, 32),
      new THREE.MeshStandardMaterial({ color, emissive: 0x222200 })
    );
  } else {
    base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 1, 32),
      new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.3, emissive: 0x111111, emissiveIntensity: 0.4, transparent: true, opacity: 0.9 })
    );
  }

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.85, 0.05, 8, 24),
    new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 1 })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1;
  group.add(rim);

  base.position.y = 0.5;
  group.add(base);

  group.name = name; // Assign name to group for interaction
  clickableObjects.push(group); // Add group to clickableObjects instead of base

  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 256;
  labelCanvas.height = 64;
  const ctx = labelCanvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = 'lime';
  ctx.font = '24px monospace';
  ctx.fillText(name, 10, 40);
  ctx.strokeStyle = '#0f0';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 256, 64);

  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  const labelMaterial = new THREE.SpriteMaterial({ map: labelTexture });
  const label = new THREE.Sprite(labelMaterial);
  label.scale.set(2, 0.5, 1);
  label.position.set(0, 2, 0);
  group.add(label);

  group.position.set(x, 0, z);

  group.userData.onClick = () => {
  equipmentInterface.style.display = 'flex';
  const clickSound = new Audio("sounds/click.mp3");
  clickSound.volume = 0.4;
  clickSound.play().catch(() => {});
};

  return group;
}


createEquipmentRoom(0, 14, 0xff3366, "Genome Editor");
createEquipmentRoom(0, -14, 0x33ff66, "Biome Analyzer");
createEquipmentRoom(-14, 0, 0x3366ff, "Cryo Storage");
createEquipmentRoom(14, 0, 0xffff66, "Synthesis Console");
createEquipmentRoom(-18, 18, 0xff8800, "AI Regulator");
createEquipmentRoom(18, -18, 0x9900cc, "Bio Forge");
createEquipmentRoom(-18, -18, 0xccff00, "Tissue Synthesizer");
createEquipmentRoom(18, 18, 0x00ccff, "Quantum Scanner");

function showFullScreenSimulation(name) {
  const overlay = document.createElement('div');
  overlay.id = 'simulation-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(0,0,0,0.85)';
  overlay.style.color = '#0f0';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.fontFamily = 'monospace';
  overlay.style.zIndex = 1000;
  overlay.style.border = '4px solid lime';
  overlay.style.boxShadow = '0 0 25px lime';
  overlay.style.backdropFilter = 'blur(6px)';

  const title = document.createElement('h1');
  title.textContent = name + ' Interface';
  title.style.marginBottom = '20px';
  title.style.fontSize = '36px';
  title.style.textShadow = '0 0 10px lime';

  const content = document.createElement('div');
  content.style.padding = '20px';
  content.style.background = 'rgba(0,255,0,0.1)';
  content.style.border = '2px solid #0f0';
  content.style.borderRadius = '10px';
  content.style.width = '60%';
  content.style.height = '40%';
  content.style.display = 'flex';
  content.style.alignItems = 'center';
  content.style.justifyContent = 'center';

  if (name === 'Lab Control Dashboard') {
    content.innerHTML = `
      <div style="text-align: left; font-size: 20px; line-height: 1.6;">
        🌡️ Temperature: 22.5°C<br>
        🧪 Air Pressure: 101.3 kPa<br>
        🌬️ Oxygen Level: 20.9%<br>
        💾 Power Status: Stable<br>
        🧬 Gene Sync Status: OK<br>
        📶 Network: Connected
      </div>`;
  } else {
    content.textContent = '🚧 Simulation content coming soon...';
  }

  const exitBtn = document.createElement('button');
  exitBtn.textContent = 'Exit';
  exitBtn.style.marginTop = '30px';
  exitBtn.style.padding = '10px 20px';
  exitBtn.style.background = '#0f0';
  exitBtn.style.color = '#000';
  exitBtn.style.border = 'none';
  exitBtn.style.cursor = 'pointer';
  exitBtn.style.fontWeight = 'bold';
  exitBtn.style.borderRadius = '5px';
  exitBtn.style.boxShadow = '0 0 10px lime';
  exitBtn.onclick = () => {
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
    const aiCoreBox = new THREE.Box3().setFromObject(aiCore);
    if (aiCoreBox.containsPoint(scientist.position)) {
      scientist.position.x += 1; // shift to avoid re-trigger
    }
  }
};

  overlay.appendChild(title);
  overlay.appendChild(content);
  overlay.appendChild(exitBtn);
  document.body.appendChild(overlay);

  const clickSound = new Audio("sounds/click.mp3");
  clickSound.volume = 0.3;
  clickSound.play().catch(() => {});
}

const roomSize = 40 * 2;
const wallMat = new THREE.MeshStandardMaterial({ color: 0xadd8e6, side: THREE.BackSide, emissive: 0xadd8e6, emissiveIntensity: 0.4 });

const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x001133, emissive: 0x001133, emissiveIntensity: 0.2 });
const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, roomSize), ceilingMat);

const stripCount = 7;
for (let i = 0; i < stripCount; i++) {
  const xPos = -roomSize / 2 + i * (roomSize / stripCount) + (roomSize / stripCount) / 2;
  for (let z = -2; z <= 2; z++) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(roomSize / stripCount - 1, 0.05, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 3 })
    );
    strip.position.set(xPos, 6.95, z * 5);
    scene.add(strip);
  }
}

ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = 7;
scene.add(ceiling);

const mainDoor = new THREE.Mesh(
  new THREE.BoxGeometry(3, 5, 0.2),
  new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0x00ffff, emissiveIntensity: 0.5 })
);
mainDoor.position.set(0, 2.5, -roomSize / 2 + 0.1);
mainDoor.name = "Main Door";
mainDoor.material.transparent = true;
scene.add(mainDoor);

const aiCore = new THREE.Mesh(
  new THREE.CylinderGeometry(1.2, 1.2, 6, 32),
  new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.6, transparent: true, opacity: 0.7 })
);
aiCore.position.set(4, 3, 0);
scene.add(aiCore);

const orbitRing = new THREE.Mesh(
  new THREE.TorusGeometry(1.8, 0.04, 8, 100),
  new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff })
);
orbitRing.rotation.x = Math.PI / 2;
orbitRing.position.y = 1;
aiCore.add(orbitRing);

const orbitRing2 = orbitRing.clone();
orbitRing2.position.y = -1;
aiCore.add(orbitRing2);

const orbitRing3 = orbitRing.clone();
orbitRing3.rotation.x = 0;
orbitRing3.rotation.z = Math.PI / 2;
orbitRing3.position.y = 0;
aiCore.add(orbitRing3);

let moodMode = 0;
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === 'l') {
    moodMode = (moodMode + 1) % 4;
    switch (moodMode) {
      case 0:
        scene.background = new THREE.Color(0x000000);
        scene.fog = null;
        break;
      case 1:
        scene.background = new THREE.Color(0x110000);
        scene.fog = new THREE.Fog(0x220000, 20, 80);
        break;
      case 2:
        scene.background = new THREE.Color(0x001122);
        scene.fog = new THREE.Fog(0x003344, 20, 80);
        break;
      case 3:
        scene.background = new THREE.Color(0x111111);
        scene.fog = new THREE.FogExp2(0x111111, 0.02);
        break;
    }
  }
});

const wall1 = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, 10), wallMat);
wall1.position.set(0, 2.5, -roomSize / 2);
scene.add(wall1);

const wall2 = wall1.clone();
wall2.position.z = roomSize / 2;
wall2.rotation.y = Math.PI;
scene.add(wall2);

const wall3 = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, 10), wallMat);
wall3.rotation.y = Math.PI / 2;
wall3.position.set(-roomSize / 2, 2.5, 0);
scene.add(wall3);

const wall4 = wall3.clone();
wall4.position.x = roomSize / 2;
scene.add(wall4);

function initMainScene() {
  animate();
}

import TWEEN from "https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@18.6.4/dist/tween.esm.js";

initMainScene();

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === 'b') {
    showFullScreenSimulation("Lab Control Dashboard");
  }
});

function switchScene(name) {
  const scientistPos = scientist.position;
  localStorage.setItem("scientistX", scientistPos.x);
  localStorage.setItem("scientistZ", scientistPos.z);
  location.reload();
}

function restoreLab() {
  location.hash = '#lab';
  location.reload();
}

if (window.location.hash === '#lab') {
  initMainScene();
} else {
  window.location.hash = '#lab';
  restoreLab();
}
