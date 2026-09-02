import { studyModelConfigs } from "./studyModels";
import type { StudyAsset } from "./studyLoadingState";
const requiredModels = new Set<string>(["desk", "chair", "rug", "curtain", "clothHandler", "laptop", "phone", "idBag", "briefcase", "book", "printer"]);
const labels: Record<keyof typeof studyModelConfigs, string> = {
    briefcase: "Handbag", chair: "Chair", chairPad: "Chair cushion", schoolBag: "School bag",
    desk: "Desk and shelves", printer: "Printer", laptop: "Laptop", phone: "Phone", book: "Open book",
    book2: "Star book", notebooks: "Shelf books", teddybear: "Teddy bear", curtain: "Curtains",
    pencilCase: "Pencil case", lamp: "Globe", oldBook: "Closed book", dessert: "Dessert cup", pen: "Pen",
    pencilBox: "Pencil box", clothHandler: "Wall hooks", umbrella: "Umbrella", idBag: "Student ID",
    bookStackFloor: "Stack of books", rug: "Rug",
};
export const studyTextures = { wallpaper: "/assets/study-wallpaper.jpg", floor: "/assets/study-floor.png" };
export const studyAssets: StudyAsset[] = [
    ...Object.entries(studyModelConfigs).filter(([, config]) => config.enabled).map(([key, config]) => ({
        src: config.src, label: labels[key as keyof typeof labels], kind: "model" as const,
        required: requiredModels.has(key), ...(key === "dessert" ? { dependsOn: studyModelConfigs.oldBook.src } : {}),
    })),
    { src: studyTextures.wallpaper, label: "Wallpaper", kind: "texture", required: true },
    { src: studyTextures.floor, label: "Floor texture", kind: "texture", required: true },
];
