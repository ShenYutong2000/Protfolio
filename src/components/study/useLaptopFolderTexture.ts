"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { projects } from "@/data/projects";

export const projectFolderLayouts = [
  { canvasX: 64, canvasY: 58, screenX: -0.315, screenY: 0.614 },
  { canvasX: 444, canvasY: 58, screenX: 0.315, screenY: 0.614 },
  { canvasX: 64, canvasY: 243, screenX: -0.315, screenY: 0.329 },
  { canvasX: 444, canvasY: 243, screenX: 0.315, screenY: 0.329 },
] as const;

// The in-room screen previews the same project folders as the accessible DOM dialog.
export function useLaptopFolderTexture(hoveredProject: number | null = null) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = 480;
    const context = canvas.getContext("2d");
    if (!context) return null;

    context.fillStyle = "#84cde8";
    context.fillRect(0, 0, 768, 480);

    context.fillStyle = "#ffffff";
    context.beginPath();
    context.moveTo(0, 40);
    context.bezierCurveTo(68, 82, 102, 8, 174, 56);
    context.bezierCurveTo(245, 102, 298, 25, 370, 64);
    context.lineTo(370, 0);
    context.lineTo(0, 0);
    context.closePath();
    context.fill();
    context.beginPath();
    context.moveTo(514, 0);
    context.bezierCurveTo(552, 72, 620, 12, 650, 70);
    context.bezierCurveTo(684, 112, 730, 47, 768, 87);
    context.lineTo(768, 0);
    context.closePath();
    context.fill();

    context.fillStyle = "#8bc77c";
    context.beginPath();
    context.moveTo(0, 282);
    context.bezierCurveTo(165, 210, 304, 272, 438, 244);
    context.bezierCurveTo(565, 218, 663, 277, 768, 235);
    context.lineTo(768, 480);
    context.lineTo(0, 480);
    context.closePath();
    context.fill();

    context.strokeStyle = "#18252a";
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(0, 282);
    context.bezierCurveTo(165, 210, 304, 272, 438, 244);
    context.bezierCurveTo(565, 218, 663, 277, 768, 235);
    context.stroke();

    context.fillStyle = "rgba(255,255,255,.92)";
    context.strokeStyle = "#17242a";
    context.lineWidth = 5;
    context.beginPath();
    context.roundRect(22, 20, 244, 50, 8);
    context.fill();
    context.stroke();
    context.fillStyle = "#17242a";
    context.font = "800 22px monospace";
    context.textAlign = "left";
    context.fillText("PROJECT DESKTOP", 40, 52);

    const colors = ["#f5d13d", "#ef7da2", "#486bd8", "#7dd6ff"];
    projectFolderLayouts.forEach(({ canvasX, canvasY }, index) => {
      const project = projects[index];
      if (!project) return;
      const x = canvasX;
      const y = canvasY;
      if (hoveredProject === index) {
        context.fillStyle = "rgba(255,255,255,.48)";
        context.strokeStyle = "rgba(24,37,42,.75)";
        context.lineWidth = 3;
        context.setLineDash([8, 6]);
        context.beginPath();
        context.roundRect(x - 18, y - 18, 296, 180, 9);
        context.fill();
        context.stroke();
        context.setLineDash([]);
      }

      context.strokeStyle = "#17242a";
      context.lineWidth = 6;
      context.fillStyle = colors[index];
      context.beginPath();
      context.roundRect(x + 8, y, 96, 34, 7);
      context.fill();
      context.stroke();
      context.beginPath();
      context.roundRect(x, y + 25, 260, 135, 9);
      context.fill();
      context.stroke();

      context.fillStyle = "#17242a";
      context.font = "900 34px monospace";
      context.textAlign = "center";
      context.fillText(project.index, x + 130, y + 86);
      context.font = "800 16px sans-serif";
      const title = project.title.length > 18 ? `${project.title.slice(0, 17)}…` : project.title;
      context.fillText(title.toUpperCase(), x + 130, y + 119);
      context.font = "700 13px monospace";
      context.fillText(`PROJECT / ${project.index}`, x + 130, y + 145);
    });

    context.fillStyle = "#f7f2df";
    context.strokeStyle = "#17242a";
    context.lineWidth = 6;
    context.fillRect(0, 427, 768, 53);
    context.beginPath();
    context.moveTo(0, 427);
    context.lineTo(768, 427);
    context.stroke();
    context.fillStyle = "#f5d13d";
    context.beginPath();
    context.roundRect(17, 438, 104, 31, 5);
    context.fill();
    context.stroke();
    context.fillStyle = "#17242a";
    context.font = "900 15px monospace";
    context.textAlign = "left";
    context.fillText("START", 45, 460);
    context.font = "700 14px monospace";
    context.textAlign = "right";
    context.fillText("CLICK A FOLDER TO OPEN PROJECTS", 742, 459);
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    result.minFilter = THREE.LinearFilter;
    result.magFilter = THREE.LinearFilter;
    result.anisotropy = 4;
    return result;
  }, [hoveredProject]);
  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}
