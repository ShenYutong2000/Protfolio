import type { ResearchItem } from "./types";

export const research = [
  {
    slug: "personality-detection-model",
    type: "Project",
    year: "2021",
    title: "Personality Detection Model",
    venue: "University Junior Project",
    status: "Completed",
    collaborators: "Main contributor",
    summary: "A machine learning study investigating the correlation between Big Five personality traits and language on social media. I collected questionnaire responses and real user posts, trained a model to predict personality from text, and used the results to explore how recognizable personality patterns appear in global literature. The project connected psychological measurement, Chinese-language NLP, and interpretive analysis in one end-to-end research workflow.",
    question: "Can we build a reliable model to predict personality based on social media text? The project began with the observation that many peers use social media as a personal diary, leaving behind a record of everyday language, opinions, and habits. This raised a broader question: can those linguistic traces provide meaningful signals about the Big Five dimensions of openness, conscientiousness, extraversion, agreeableness, and neuroticism without reducing a person to a single label?",
    method: "I collected BFI-2 questionnaire responses from 150 participants and paired each response with up to 50 recent Weibo posts. After scoring and labeling the five OCEAN traits, I cleaned the Chinese text with pyhanlp.harvesttext and tokenized it with Jieba. I then framed each trait as a binary classification task, compared five classifiers and six baseline models, and fine-tuned a Chinese BERT model with Hugging Face and scikit-learn workflows. Weekly feedback from my professor and peers helped refine the data pipeline, model comparison, and testing scope.",
    result: "The project produced a functional personality-prediction tool and a set of visual analyses covering label distributions, word counts, and model performance. I also used the predictions to examine literary characters such as Mr. Darcy and Elizabeth Bennet, testing how a data-driven lens might complement close reading. The evaluation showed a useful starting point for personality inference while revealing important next steps: broader and more balanced data, stronger validation, clearer communication of uncertainty, and a more engaging app-based presentation.",
    keywords: ["Personality detection", "Big Five / OCEAN", "Social media NLP", "Machine learning", "Chinese BERT"],
    links: [],
    visuals: {
      hero: "/assets/research/personality-detection-workflow.jpg",
      question: "/assets/research/personality-detection-data-collection.png",
      method: "/assets/research/personality-detection-models.png",
      finding: "/assets/research/personality-detection-finding.png",
    },
  },
] satisfies ResearchItem[];

export function getResearchItem(slug: string) {
  return research.find((item) => item.slug === slug);
}
