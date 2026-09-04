"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { projects } from "@/data/content";

// The in-room screen previews the same project folders as the accessible DOM dialog.
export function useLaptopFolderTexture() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = 480;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.fillStyle = "#f7f0f2";
    context.fillRect(0, 0, 768, 480);
    context.fillStyle = "#b881a2";
    context.fillRect(0, 0, 768, 53);
    context.fillStyle = "#fff6fa";
    context.font = "bold 22px monospace";
    context.fillText("PROJECT FILES", 25, 35);
    context.font = "16px monospace";
    context.textAlign = "right";
    context.fillText(`${String(projects.length).padStart(2, "0")} folders`, 738, 34);
    const colors = ["#b4dd45", "#3154df", "#202525"];
    projects.slice(0, 3).forEach((project, index) => {
      const x = 42 + index * 238;
      context.fillStyle = "#ddd4db";
      context.fillRect(x + 5, 137, 207, 160);
      context.fillStyle = colors[index];
      context.beginPath();
      context.roundRect(x, 113, 76, 40, 8);
      context.fill();
      context.beginPath();
      context.roundRect(x, 132, 207, 158, 9);
      context.fill();
      context.fillStyle = index === 0 ? "#3049b9" : index === 1 ? "#d1e867" : "#f29281";
      context.font = "bold 37px monospace";
      context.textAlign = "left";
      context.fillText(project.index, x + 20, 248);
      context.fillStyle = "#725872";
      context.font = "bold 17px sans-serif";
      let line = "";
      let y = 326;
      project.title.split(" ").forEach((word) => {
        const next = line ? `${line} ${word}` : word;
        if (context.measureText(next).width > 207 && line) { context.fillText(line, x, y); line = word; y += 23; }
        else line = next;
      });
      context.fillText(line, x, y);
    });
    context.fillStyle = "#e9dce5";
    context.fillRect(0, 431, 768, 49);
    context.fillStyle = "#99728f";
    context.font = "16px monospace";
    context.textAlign = "left";
    context.fillText("Click to explore projects", 25, 461);
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    result.minFilter = THREE.LinearFilter;
    result.magFilter = THREE.LinearFilter;
    result.anisotropy = 4;
    return result;
  }, []);
  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}
