import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import { VoxelSceneController, type VoxelInteractionPayload } from './VoxelScene';
import type { BlockStyle, CameraView, VoxelTool, VoxelTuple } from './types';

export interface VoxelCanvasHandle {
  resetCamera: () => void;
  setCameraView: (view: CameraView) => void;
  frameModel: (voxels: VoxelTuple[]) => void;
  capturePng: () => string | null;
}

interface VoxelCanvasProps {
  voxels: VoxelTuple[];
  guideVoxels: VoxelTuple[];
  tool: VoxelTool;
  activeColor: string;
  blockStyle: BlockStyle;
  gridSize: 8 | 12 | 16;
  maxVisibleLayer: number;
  gridVisible: boolean;
  onBlockAction: (payload: VoxelInteractionPayload) => void;
}

export const VoxelCanvas = forwardRef<VoxelCanvasHandle, VoxelCanvasProps>(
  (
    {
      voxels,
      guideVoxels,
      tool,
      activeColor,
      blockStyle,
      gridSize,
      maxVisibleLayer,
      gridVisible,
      onBlockAction,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const controllerRef = useRef<VoxelSceneController | null>(null);
    const actionCallbackRef = useRef(onBlockAction);
    actionCallbackRef.current = onBlockAction;

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const controller = new VoxelSceneController({
        container: el,
        onBlockAction: (payload) => actionCallbackRef.current(payload),
      });
      controllerRef.current = controller;
      return () => {
        controller.dispose();
        controllerRef.current = null;
      };
    }, []);

    useEffect(() => {
      controllerRef.current?.setTool(tool);
    }, [tool]);

    useEffect(() => {
      controllerRef.current?.setActiveColor(activeColor);
    }, [activeColor]);

    useEffect(() => {
      controllerRef.current?.setMaxVisibleLayer(maxVisibleLayer);
      controllerRef.current?.updateVoxels(voxels, guideVoxels);
    }, [maxVisibleLayer, voxels, guideVoxels]);

    useEffect(() => {
      controllerRef.current?.setGridVisible(gridVisible);
    }, [gridVisible]);

    useEffect(() => {
      controllerRef.current?.setBlockStyle(blockStyle);
    }, [blockStyle]);

    useEffect(() => {
      controllerRef.current?.setGridSize(gridSize);
    }, [gridSize]);

    useImperativeHandle(ref, () => ({
      resetCamera: () => controllerRef.current?.resetCamera(),
      setCameraView: (view: CameraView) => controllerRef.current?.setCameraView(view),
      frameModel: (targetVoxels: VoxelTuple[]) => controllerRef.current?.frameModel(targetVoxels),
      capturePng: () => controllerRef.current?.capturePngDataUrl() ?? null,
    }));

    return (
      <div
        ref={containerRef}
        className="w-full h-full touch-none select-none cursor-crosshair"
        aria-label="Interactive 3D Voxel Studio canvas"
      />
    );
  },
);

VoxelCanvas.displayName = 'VoxelCanvas';
