import { Object3DNode } from '@react-three/fiber'
import { BufferGeometry, Material, Mesh, PlaneGeometry, Points, ShaderMaterial } from 'three'

declare global {
    namespace JSX {
        interface IntrinsicElements {
            points: Object3DNode<Points, typeof Points>
            bufferGeometry: Object3DNode<BufferGeometry, typeof BufferGeometry>
            bufferAttribute: any
            shaderMaterial: Object3DNode<ShaderMaterial, typeof ShaderMaterial>
            mesh: Object3DNode<Mesh, typeof Mesh>
            planeGeometry: Object3DNode<PlaneGeometry, typeof PlaneGeometry>
        }
    }
}
