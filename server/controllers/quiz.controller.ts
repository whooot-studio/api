const quizzes = [
  {
    id: 1,
    type: "single",
    name: "Fun Facts Quiz",
    author: "Emily Harper",
    questions: [
      {
        question: "What is the tallest animal in the world?",
        options: ["Elephant", "Giraffe", "Tiger", "Bear"],
        answer: "Giraffe",
      },
      {
        question: "Which planet is known as the Red Planet?",
        options: ["Mars", "Venus", "Jupiter", "Saturn"],
        answer: "Mars",
      },
    ],
  },
  {
    id: 2,
    type: "single",
    name: "Linux Basics",
    author: "Jack Thompson",
    questions: [
      {
        question: "What does the 'ls' command do?",
        options: ["List files", "Delete files"],
        answer: "List files",
      },
      {
        question:
          "Which command is used to display the current working directory?",
        options: ["pwd", "cd", "ls"],
        answer: "pwd",
      },
      {
        question: "What is the root user in Linux?",
        options: ["A regular user", "The administrator"],
        answer: "The administrator",
      },
    ],
  },
  {
    id: 3,
    type: "single",
    name: "French Politics Quiz",
    author: "Claire Dupont",
    questions: [
      {
        question: "Who was the President of France in 2020?",
        options: [
          "Emmanuel Macron",
          "François Hollande",
          "Nicolas Sarkozy",
          "Jacques Chirac",
        ],
        answer: "Emmanuel Macron",
      },
      {
        question: "What is the French parliament called?",
        options: ["National Assembly", "House of Commons", "Senate"],
        answer: "National Assembly",
      },
    ],
  },
  {
    id: 4,
    type: "single",
    name: "Nuclear Science Quiz",
    author: "Dr. Alan Carter",
    questions: [
      {
        question: "What particle is split in nuclear fission?",
        options: ["Proton", "Neutron", "Electron"],
        answer: "Neutron",
      },
      {
        question: "Which element is commonly used in nuclear reactors?",
        options: ["Uranium", "Gold", "Carbon", "Silver"],
        answer: "Uranium",
      },
      {
        question: "What does 'C' stand for in E=mc^2?",
        options: ["Constant", "Speed of Light", "Charge"],
        answer: "Speed of Light",
      },
    ],
  },
  {
    id: 5,
    type: "single",
    name: "World Geography",
    author: "Sophia Reed",
    questions: [
      {
        question: "Which is the largest continent by area?",
        options: ["Asia", "Africa", "Europe", "Antarctica"],
        answer: "Asia",
      },
      {
        question: "What is the capital of Australia?",
        options: ["Sydney", "Canberra", "Melbourne", "Perth"],
        answer: "Canberra",
      },
    ],
  },
  {
    id: 6,
    type: "single",
    name: "Animal Kingdom",
    author: "Liam Woods",
    questions: [
      {
        question: "What is a group of lions called?",
        options: ["Pride", "Pack", "Herd"],
        answer: "Pride",
      },
      {
        question: "Which bird is known for its colorful tail feathers?",
        options: ["Peacock", "Eagle", "Sparrow", "Parrot"],
        answer: "Peacock",
      },
    ],
  },
  {
    id: 7,
    type: "single",
    name: "Programming Languages",
    author: "Olivia Stone",
    questions: [
      {
        question: "Which language is known as the backbone of the web?",
        options: ["Python", "Java", "JavaScript", "C++"],
        answer: "JavaScript",
      },
      {
        question: "What is Python primarily used for?",
        options: [
          "Data Science",
          "Web Development",
          "Automation",
          "All of the above",
        ],
        answer: "All of the above",
      },
      {
        question: "What does HTML stand for?",
        options: [
          "HyperText Markup Language",
          "HyperText Management Language",
          "HighText Machine Language",
        ],
        answer: "HyperText Markup Language",
      },
    ],
  },
  {
    id: 8,
    type: "single",
    name: "History Quiz",
    author: "Ethan Brown",
    questions: [
      {
        question: "Who discovered America in 1492?",
        options: ["Christopher Columbus", "Amerigo Vespucci", "Leif Erikson"],
        answer: "Christopher Columbus",
      },
      {
        question: "When did World War II end?",
        options: ["1945", "1939", "1941", "1950"],
        answer: "1945",
      },
    ],
  },
  {
    id: 9,
    type: "single",
    name: "Sports Trivia",
    author: "Mason Clark",
    questions: [
      {
        question: "How many players are on a soccer team?",
        options: ["9", "11", "13", "15"],
        answer: "11",
      },
      {
        question: "Which sport uses a puck?",
        options: ["Hockey", "Basketball", "Cricket"],
        answer: "Hockey",
      },
    ],
  },
  {
    id: 10,
    type: "single",
    name: "Space Exploration",
    author: "Ava Davis",
    questions: [
      {
        question: "What is the name of the first satellite sent into space?",
        options: ["Sputnik", "Apollo", "Voyager", "Challenger"],
        answer: "Sputnik",
      },
      {
        question: "Who was the first human to step on the moon?",
        options: ["Buzz Aldrin", "Neil Armstrong", "Yuri Gagarin"],
        answer: "Neil Armstrong",
      },
      {
        question: "Which planet is the hottest in the solar system?",
        options: ["Venus", "Mercury", "Mars"],
        answer: "Venus",
      },
    ],
  },
];
export type Quiz = typeof quizzes[number];

export async function listQuizzes() {
  return quizzes;
}

export async function getQuiz(id: number) {
  return quizzes.find((quiz) => quiz.id === id);
}

export async function createQuiz(quiz: any) {
  if (!quiz.id) throw new Error("Quiz ID is required");
  if (quizzes.find((q) => q.id === quiz.id))
    throw new Error("Quiz ID already exists");

  quizzes.push(quiz);
  return quiz;
}

export async function updateQuiz(id: number, quiz: any) {
  const index = quizzes.findIndex((q) => q.id === id);
  if (index === -1) throw new Error("Quiz not found");

  quizzes[index] = quiz;
  return quiz;
}

export async function deleteQuiz(id: number) {
  const index = quizzes.findIndex((q) => q.id === id);
  if (index === -1) throw new Error("Quiz not found");

  quizzes.splice(index, 1);
}

export default {
  listQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
};
