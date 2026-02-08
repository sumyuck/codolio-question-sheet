import type { Question, SheetState } from '../types/sheet';

export const filterQuestions = (sheet: SheetState, query: string) => {
  if (!query.trim()) return sheet;
  const lower = query.toLowerCase();
  return {
    ...sheet,
    topics: sheet.topics.map((topic) => ({
      ...topic,
      subTopics: topic.subTopics.map((subTopic) => ({
        ...subTopic,
        questions: subTopic.questions.filter((question) =>
          [question.title, question.source, question.difficulty]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(lower))
        )
      }))
    }))
  };
};

export const computeOverallProgress = (sheet: SheetState) => {
  const allQuestions = sheet.topics.flatMap((topic) =>
    topic.subTopics.flatMap((subTopic) => subTopic.questions)
  );
  const solved = allQuestions.filter((question) => question.solved).length;
  return { solved, total: allQuestions.length };
};

export const isYoutube = (question: Question) => {
  if (!question.youtubeUrl) return false;
  return question.youtubeUrl.includes('youtu');
};
