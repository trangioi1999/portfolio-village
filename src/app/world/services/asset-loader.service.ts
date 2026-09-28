import { Injectable } from '@angular/core';
import { AnimationClip, Group, Mesh, Texture, TextureLoader } from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Loads and caches GLTF/GLB models and textures. Buildings declare an optional
 * `modelUrl` — when set, the model replaces the procedural placeholder. Each URL is
 * fetched once; callers receive clones.
 */
@Injectable()
export class AssetLoaderService {
  private readonly gltf = new GLTFLoader();
  private readonly textures = new TextureLoader();
  private readonly models = new Map<string, Promise<Group>>();
  private readonly textureCache = new Map<string, Promise<Texture>>();

  async loadModel(url: string): Promise<Group> {
    let pending = this.models.get(url);
    if (!pending) {
      pending = this.gltf.loadAsync(url).then((gltf) => {
        gltf.scene.traverse((o) => {
          const mesh = o as Mesh;
          if (mesh.isMesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });
        return gltf.scene;
      });
      this.models.set(url, pending);
    }
    return (await pending).clone(true);
  }

  /** Load a GLB with its animation clips (skinned meshes are cloned safely). */
  async loadGltf(url: string): Promise<{ scene: Group; animations: AnimationClip[] }> {
    const gltf = await this.gltf.loadAsync(url);
    gltf.scene.traverse((o) => {
      const mesh = o as Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return { scene: cloneSkinned(gltf.scene) as Group, animations: gltf.animations };
  }

  loadTexture(url: string): Promise<Texture> {
    let pending = this.textureCache.get(url);
    if (!pending) {
      pending = this.textures.loadAsync(url);
      this.textureCache.set(url, pending);
    }
    return pending;
  }

  dispose(): void {
    this.textureCache.forEach((p) => p.then((t) => t.dispose()).catch(() => undefined));
    this.models.clear();
    this.textureCache.clear();
  }
}
