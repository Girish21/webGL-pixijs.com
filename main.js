import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import bg1 from './images/bg1.jpeg'
import bg2 from './images/bg2.jpeg'
import blob from './images/blob.png'
import fragmentShader from './shader/fragment.frag?raw'
import vertexShader from './shader/vertex.vert?raw'

import './style.css'

function randomRange(a, b) {
  const random = Math.random()
  return a + (b - a) * random
}

class Sketch {
  constructor(el) {
    this.domElement = el

    this.windowSize = new THREE.Vector2(
      this.domElement.offsetWidth,
      this.domElement.offsetHeight
    )
    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()
    this.point = new THREE.Vector3()

    this.scene = new THREE.Scene()
    this.renderScene = new THREE.Scene()
    this.renderTarget = new THREE.WebGLRenderTarget(
      this.windowSize.x,
      this.windowSize.y
    )
    this.camera = new THREE.OrthographicCamera(
      1 / -2,
      1 / 2,
      1 / 2,
      1 / -2,
      -1000,
      1000
    )
    this.camera.position.z = 1
    this.scene.add(this.camera)

    this.clock = new THREE.Clock()

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.domElement.append(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true

    this.textureLoader = new THREE.TextureLoader()

    this.addBlobs()
    this.addObject()
    this.addEventListener()
    this.resize()
    this.render()
  }

  addBlobs() {
    this.blobs = []
    const blobMesh = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(0.2, 0.2),
      new THREE.MeshBasicMaterial({
        map: this.textureLoader.load(blob),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
      })
    )
    blobMesh.position.z = 0.1
    for (let i = 0; i < 50; i++) {
      const blobMeshClone = blobMesh.clone()

      const theta = randomRange(0, Math.PI * 2)
      const radius = randomRange(0.04, 0.14)

      blobMeshClone.position.x = radius * Math.sin(theta)
      blobMeshClone.position.y = radius * Math.cos(theta)
      blobMeshClone.userData.life = randomRange(-Math.PI * 2, Math.PI * 2)
      this.renderScene.add(blobMeshClone)
      this.blobs.push(blobMeshClone)
    }
  }

  updateBlobs() {
    this.blobs.forEach(blob => {
      blob.userData.life += 0.1
      blob.scale.setScalar(Math.sin(0.5 * blob.userData.life))

      if (blob.userData.life > Math.PI * 2) {
        blob.userData.life = -Math.PI * 2

        const theta = randomRange(0, Math.PI * 2)
        const radius = randomRange(0.04, 0.14)

        blob.position.x = this.point.x + radius * Math.sin(theta)
        blob.position.y = this.point.y + radius * Math.cos(theta)
      }
    })
  }

  addObject() {
    this.geometry = new THREE.PlaneBufferGeometry(1, 1)
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2() },
        uMask: { value: null },
        uTexture: { value: this.textureLoader.load(bg1) },
        uOverlayTexture: { value: this.textureLoader.load(bg2) },
      },
      fragmentShader,
      vertexShader,
      transparent: true,
    })
    this.mesh = new THREE.Mesh(this.geometry, this.material)

    this.backgroundMesh = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: this.textureLoader.load(bg2) })
    )
    this.backgroundMesh.position.z = -0.001

    this.scene.add(this.backgroundMesh)
    this.scene.add(this.mesh)
  }

  resize() {
    this.windowSize.set(
      this.domElement.offsetWidth,
      this.domElement.offsetHeight
    )

    this.camera.aspect = this.windowSize.x / this.windowSize.y
    this.camera.updateProjectionMatrix()

    this.renderTarget.setSize(this.windowSize.x, this.windowSize.y)
    this.renderer.setSize(this.windowSize.x, this.windowSize.y)
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
  }

  onPointerMove(event) {
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
  }

  addEventListener() {
    window.addEventListener('resize', this.resize.bind(this))
    window.addEventListener('mousemove', this.onPointerMove.bind(this))
  }

  render() {
    const elapsedTime = this.clock.getElapsedTime()

    this.raycaster.setFromCamera(this.pointer, this.camera)
    const intersects = this.raycaster.intersectObjects(this.scene.children)

    this.material.uniforms.uTime.value = elapsedTime

    if (intersects[0]) {
      this.material.uniforms.uMouse.value = intersects[0].uv
      this.point.copy(intersects[0].point)
    }
    this.updateBlobs()

    this.renderer.setRenderTarget(this.renderTarget)
    this.renderer.render(this.renderScene, this.camera)
    this.material.uniforms.uMask.value = this.renderTarget.texture
    this.renderer.setRenderTarget(null)

    this.controls.update()

    this.renderer.render(this.scene, this.camera)

    window.requestAnimationFrame(this.render.bind(this))
  }
}

new Sketch(document.getElementById('app'))
