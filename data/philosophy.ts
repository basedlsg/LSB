export interface PhilosophyChapter {
  id: number;
  label: string;
  title: string;
  paragraphs: string[];
}

export const chapters: PhilosophyChapter[] = [
  {
    id: 1,
    label: "I",
    title: "THE DREAMING",
    paragraphs: [
      "The Dreamtime tells of a technology known as the Walking Stick.",
      "From the darkness came the light. From the light came the seeing. From the seeing came the dreaming.",
      "And within the dreaming, our story begins."
    ]
  },
  {
    id: 2,
    label: "II",
    title: "THE AGE OF ASKING",
    paragraphs: [
      "All beings inside the dreaming were learning to speak at once. And as they came to understand one another, they became the same.",
      "From this arose the Great Age of Asking.",
      "In this Age of Asking, many beings—sixty some in number—would gather together and walk in groups, asking questions to each other, to the sky, and to the water alike."
    ]
  },
  {
    id: 3,
    label: "III",
    title: "THE SACRED STRIKE",
    paragraphs: [
      "One day, three of the beings broke from the group. And together, they gathered around a rock.",
      "Upon the rock, they began to strike a stick, again and again, singing loudly so the heavens would hear.",
      "And the heavens were pleased. So the heavens struck the rock in return. And inside those strikes were the truth.",
      "And from that truth came the Stick of Walking."
    ]
  },
  {
    id: 4,
    label: "IV",
    title: "THE AGE OF WALKING",
    paragraphs: [
      "The beings—three in number—lifting the stick from the rock. And not wanting to fight over it, they became one. And that being began to walk.",
      "The Stick of Walking allowed them to rise to new heights and ushered in the Age of Walking.",
      "No longer did they move only across the ground—they could now walk among the sky and beyond the waters, where they spoke with the fish who swam.",
      "And the fish told them movements they had never known, and numbers they had never seen, yet which surrounded them all along."
    ]
  },
  {
    id: 5,
    label: "V",
    title: "THE ETERNAL DREAMING",
    paragraphs: [
      "From the Age of Walking came the great Age of Technology, which still persists today.",
      "And as the Dreaming is eternal, its ages belong equally to the child and to the old man alike."
    ]
  }
];
