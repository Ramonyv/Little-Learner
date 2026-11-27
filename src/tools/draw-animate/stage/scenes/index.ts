import type { SceneKind } from '../../types';
import { buildDiwaliScene } from './diwali';
import { buildMeadowScene, type ProceduralSceneHandle } from './meadow';
import { buildOceanScene } from './ocean';
import { buildSpaceScene } from './space';

export function buildStageScene(
  kind: SceneKind,
  stageWidth: number,
  stageHeight: number,
): ProceduralSceneHandle {
  switch (kind) {
    case 'ocean':
      return buildOceanScene(stageWidth, stageHeight);
    case 'space':
      return buildSpaceScene(stageWidth, stageHeight);
    case 'diwali':
      return buildDiwaliScene(stageWidth, stageHeight);
    case 'meadow':
    default:
      return buildMeadowScene(stageWidth, stageHeight);
  }
}
