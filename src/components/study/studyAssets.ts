import { studyModelConfigs } from "./studyModels";
import type { StudyAsset } from "./studyLoadingState";
const criticalModels = new Set<string>(["desk", "chair", "rug", "curtain", "laptop", "briefcase", "book"]);
const labels: Record<keyof typeof studyModelConfigs, string> = {
    briefcase: "Handbag", chair: "Chair", chairPad: "Chair cushion", schoolBag: "School bag",
    desk: "Desk and shelves", printer: "Printer", laptop: "Laptop", phone: "Phone", book: "Open book",
    book2: "Star book", notebooks: "Shelf books", teddybear: "Teddy bear", curtain: "Curtains",
    pencilCase: "Pencil case", lamp: "Globe", oldBook: "Closed book", dessert: "Dessert cup", pen: "Pen",
    pencilBox: "Pencil box", clothHandler: "Wall hooks", umbrella: "Umbrella", idBag: "Student ID",
    bookStackFloor: "Stack of books", rug: "Rug",
};
export const studyTextures = { wallpaper: "/assets/study-wallpaper.jpg", floor: "/assets/study-floor.webp" };
export const studyAssets: StudyAsset[] = [
    ...Object.entries(studyModelConfigs).filter(([, config]) => config.enabled).map(([key, config]) => ({
        src: config.src, label: labels[key as keyof typeof labels], kind: "model" as const,
        required: criticalModels.has(key), loadTier: criticalModels.has(key) ? "critical" as const : "background" as const,
        ...(key === "dessert" ? { dependsOn: studyModelConfigs.oldBook.src } : {}),
    })),
    { src: studyTextures.wallpaper, label: "Wallpaper", kind: "texture", required: true, loadTier: "critical" },
    { src: studyTextures.floor, label: "Floor texture", kind: "texture", required: true, loadTier: "critical" },
];
