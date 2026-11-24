export const features = [
  {
    icon: "GraduationCap",
    tone: "primary",
    title: "Structured lessons",
    text: "43 lessons from absolute beginner to A1, each with clear goals, examples, practice and review.",
  },
  {
    icon: "Sparkles",
    tone: "indigo",
    title: "Practice that explains",
    text: "Thirteen exercise types with instant, kind feedback. Mistakes come with an explanation, never a penalty.",
  },
  {
    icon: "MessageCircle",
    tone: "accent",
    title: "A patient AI tutor",
    text: "Ask anything, get corrections and examples at your level, in your language when you need it.",
  },
  {
    icon: "Mic",
    tone: "primary",
    title: "Real-life conversations",
    text: "16 role-play scenarios, from ordering food to job interviews, with a learning report at the end.",
  },
  {
    icon: "BookBookmark",
    tone: "indigo",
    title: "Words that stay",
    text: "Save words and review them with spaced repetition, so you see each word just before you would forget it.",
  },
  {
    icon: "PenLine",
    tone: "accent",
    title: "Writing feedback",
    text: "Paste an email or a paragraph. See grammar fixes separately from optional style suggestions.",
  },
] as const;

export const faq = [
  {
    q: "Is Englishy really free?",
    a: "Yes. The full curriculum, practice, vocabulary and grammar library are free. AI features are free too, with a fair daily limit so the service stays available for everyone.",
  },
  {
    q: "Do I need an account?",
    a: "No. You can start straight away. Your progress is saved in your browser on this device, and you can download a backup at any time.",
  },
  {
    q: "I know no English at all. Can I start here?",
    a: 'Yes. Choose "I know no English" and you start with letters and sounds. Beginner lessons include short tips in Hindi, Bengali, Spanish, French, Portuguese, Arabic and Chinese.',
  },
  {
    q: "Which levels are available?",
    a: "This release has a complete Pre-A1 and A1 course. Higher levels (A2 to C2) are planned and clearly marked. More advanced learners can already use the tutor, conversations, writing feedback and grammar library.",
  },
  {
    q: "Is this an official CEFR certificate?",
    a: "No. Lessons are organised using CEFR levels, and the level check gives an informal recommendation. Englishy is not an accredited exam or certification provider.",
  },
  {
    q: "What happens to what I type to the AI?",
    a: "Messages to the AI are sent from our server to NVIDIA’s API to generate a reply. We do not sell your data or use advertising trackers. Your saved chats stay in your browser. See Help & About for full details.",
  },
  {
    q: "Does it work offline?",
    a: "Once loaded, lessons, grammar, vocabulary review and progress tracking work offline. AI features need an internet connection.",
  },
] as const;

export const badges = [
  "Tips in 8 languages",
  "British or American English",
  "Works offline",
  "Progress stays on your device",
] as const;

export const steps = [
  {
    t: "Tell us where you are",
    d: "Choose your language and goals. Start from zero, or take an optional, informal level check.",
  },
  {
    t: "Learn in small steps",
    d: "Each lesson takes 6 to 11 minutes: a short explanation, real examples, then practice with instant feedback.",
  },
  {
    t: "Use it for real",
    d: "Practise conversations, get writing feedback and review words just before you would forget them.",
  },
] as const;

export const learningFeatures = [
  {
    icon: "Languages",
    t: "Your language, then more English",
    d: "Absolute beginners see tips in their first language. As you progress, explanations move towards English.",
  },
  {
    icon: "Sparkles",
    t: "Next steps from your results",
    d: "Your home screen recommends the next lesson and the topics you found hardest, based only on what you actually did.",
  },
  {
    icon: "BookBookmark",
    t: "Reviews when you need them",
    d: "Words you find easy appear less often. Words you forget come back sooner.",
  },
  {
    icon: "Mic",
    t: "Speaking when you are ready",
    d: "Optional listening and speaking practice with your browser’s speech features. Every accent is welcome.",
  },
] as const;

export const trustFeatures = [
  {
    icon: "ShieldCheck",
    t: "Privacy first",
    d: "No account, no advertising trackers. Progress is stored in your browser. Back it up or delete it whenever you like.",
  },
  {
    icon: "Accessibility",
    t: "Built for everyone",
    d: "Keyboard and screen reader support, larger text, reduced motion, dark mode and no timed exercises.",
  },
  {
    icon: "WifiOff",
    t: "Works on slow connections",
    d: "Install it like an app. Lessons and reviews keep working offline; AI features wait for a connection.",
  },
] as const;

export const helpArticles = [
  {
    id: "start",
    title: "Getting started",
    children: {
      tag: "ul",
      children: [
        {
          tag: "li",
          children: [
            "Start at ",
            {
              tag: "link",
              to: "/learn",
              children: "Learn",
            },
            ". Each lesson has objectives, a short explanation, examples, practice and a review.",
          ],
        },
        {
          tag: "li",
          children:
            "A lesson is completed when you answer at least 70% of the questions correctly. You can repeat any lesson as often as you like; your best result is kept.",
        },
        {
          tag: "li",
          children: [
            "Wrong answers are recorded so ",
            {
              tag: "link",
              to: "/practise",
              children: "Practise",
            },
            " can suggest what to revise. There are no lives, timers or penalties.",
          ],
        },
        {
          tag: "li",
          children: [
            "Save words from lessons and review them in ",
            {
              tag: "link",
              to: "/vocabulary",
              children: "Vocabulary",
            },
            ".",
          ],
        },
        {
          tag: "li",
          children: [
            "Keyboard shortcuts in exercises: press ",
            {
              tag: "kbd",
              children: "1",
            },
            "–",
            {
              tag: "kbd",
              children: "4",
            },
            " to choose an option and",
            " ",
            {
              tag: "kbd",
              children: "Enter",
            },
            " to check or continue.",
          ],
        },
      ],
    },
  },
  {
    id: "ai",
    title: "AI features and their limits",
    children: [
      {
        tag: "p",
        children: [
          'The AI tutor, conversation practice, writing feedback and "Explain in my language" use large language models provided by NVIDIA. Status on this server:',
          " ",
          {
            tag: "strong",
            children: {
              statusText: {
                loading: "checking…",
                online: "available",
                offline: "not available right now",
              },
            },
          },
          ".",
        ],
      },
      {
        tag: "ul",
        children: [
          {
            tag: "li",
            children:
              "AI can make mistakes. The main curriculum and answer checking are written and checked in advance and do not depend on AI.",
          },
          {
            tag: "li",
            children:
              "To keep the service free, there is a fair daily limit on AI requests. When it is reached, everything else keeps working.",
          },
          {
            tag: "li",
            children:
              "The AI is instructed to stay focused on learning English, to be encouraging, and to respect all varieties of English and all accents.",
          },
          {
            tag: "li",
            children:
              "Do not share personal details such as your full name, address, passwords or payment information in chats.",
          },
          {
            tag: "li",
            children:
              "Speaking practice gives transcription-based feedback. It is not a precise pronunciation score.",
          },
        ],
      },
    ],
  },
  {
    id: "offline",
    title: "Offline use",
    children: [
      {
        tag: "p",
        children: [
          "After your first visit, ",
          "Englishy",
          " can work without an internet connection:",
        ],
      },
      {
        tag: "ul",
        children: [
          {
            tag: "li",
            children:
              "Available offline: all lessons and exercises, the grammar library, vocabulary notebook and flashcards, progress tracking and settings.",
          },
          {
            tag: "li",
            children:
              "Needs internet: the AI tutor, conversation practice, writing feedback, AI explanations and (in most browsers) speech recognition.",
          },
          {
            tag: "li",
            children:
              "Your progress is saved on your device immediately, so nothing is lost if your connection drops.",
          },
          {
            tag: "li",
            children: [
              "You can install ",
              "Englishy",
              ' from your browser menu ("Install app" or "Add to Home Screen").',
            ],
          },
        ],
      },
    ],
  },
  {
    id: "privacy",
    title: "Privacy",
    children: [
      {
        tag: "p",
        children: [
          {
            tag: "strong",
            children: "Stored on your device only",
          },
          " (in your browser's IndexedDB): your preferences, lesson progress, exercise results, activity history, saved words and review schedules, and, if you choose, your AI conversations. There is no account and no server copy.",
        ],
      },
      {
        tag: "p",
        children: [
          {
            tag: "strong",
            children: "Sent to NVIDIA",
          },
          " when you use an AI feature: the message or text you submit, a limited amount of recent conversation context, and a short learner profile (level, first language, explanation language, English variety and goals). Your full history is never sent. Requests go through our server, which adds the API key; your browser never talks to NVIDIA directly. NVIDIA processes the request under its own terms and privacy policy.",
        ],
      },
      {
        tag: "p",
        children: [
          {
            tag: "strong",
            children: "Stored on our server",
          },
          ": no learning content. To prevent abuse, the server keeps a daily counter of AI requests linked to a one-way hash of your IP address (not the address itself). Our server does not log the content of your messages.",
        ],
      },
      {
        tag: "p",
        children: [
          {
            tag: "strong",
            children: "Microphone",
          },
          ": speaking practice only starts after you agree and your browser grants permission. It uses your browser's speech recognition, which in some browsers (such as Chrome) sends audio to the browser maker for transcription. ",
          "Englishy",
          " never records or stores audio.",
        ],
      },
      {
        tag: "p",
        children: [
          {
            tag: "strong",
            children: "No trackers",
          },
          ": no advertising, analytics or third-party tracking scripts. Fonts are served from this site.",
        ],
      },
      {
        tag: "p",
        children: [
          {
            tag: "strong",
            children: "Your control",
          },
          ": download a backup, restore it or delete everything from ",
          {
            tag: "link",
            to: "/settings#data",
            children: "Settings → Your data",
          },
          ". You can also turn off “Keep my chats on this device” under Settings → AI tutor.",
        ],
      },
      {
        tag: "p",
        children: [
          "We have designed ",
          "Englishy",
          " with UK GDPR principles (data minimisation, transparency, user control) in mind. This page is a plain-language description, not legal advice or a certification of compliance. If you are under 13, please use ",
          "Englishy",
          " with a parent, guardian or teacher.",
        ],
      },
    ],
  },
  {
    id: "accessibility",
    title: "Accessibility",
    children: [
      {
        tag: "ul",
        children: [
          {
            tag: "li",
            children:
              'Full keyboard navigation with visible focus, a "skip to main content" link and screen reader labels.',
          },
          {
            tag: "li",
            children:
              "Text size options, reduced motion, light and dark themes, and right-to-left layout for Arabic.",
          },
          {
            tag: "li",
            children:
              "Feedback never relies on colour alone: icons and text always explain results.",
          },
          {
            tag: "li",
            children:
              "No timed exercises. Audio and speaking exercises always have a text alternative or can be skipped without affecting your score.",
          },
        ],
      },
      {
        tag: "p",
        children:
          "We aim to follow WCAG 2.2 AA. If something does not work for you, please let us know.",
      },
    ],
  },
  {
    id: "about",
    title: "About Englishy",
    children: [
      {
        tag: "p",
        children: [
          "Englishy",
          " is a free English learning app. Lessons are organised by the Common European Framework of Reference for Languages (CEFR). ",
          "Englishy",
          " is not an accredited assessment provider, and the placement check is an informal recommendation, not a qualification.",
        ],
      },
      {
        tag: "p",
        children:
          "Interface translations are available in English, Hindi, Bengali, Spanish, French, Portuguese, Arabic and Simplified Chinese. Lesson content is in English, with native-language tips for Pre-A1 lessons. Translations have not yet all been reviewed by native-speaking teachers; if you spot a problem, please tell us.",
      },
    ],
  },
] as const;

export const speakingActivities = [
  {
    id: "words",
    tab: "listen",
    title: "Listen and identify words",
    desc: "Hear a word and choose what you heard.",
    icon: "Ear",
  },
  {
    id: "complete",
    tab: "listen",
    title: "Listen and complete",
    desc: "Hear a sentence and choose the missing word.",
    icon: "AudioLines",
  },
  {
    id: "dictation",
    tab: "listen",
    title: "Dictation",
    desc: "Hear a sentence and type it.",
    icon: "Keyboard",
  },
  {
    id: "repeat",
    tab: "speak",
    title: "Repeat sentences",
    desc: "Listen, then say the sentence aloud.",
    icon: "Repeat",
  },
  {
    id: "read",
    tab: "speak",
    title: "Read aloud",
    desc: "Read short texts and compare with what was heard.",
    icon: "BookOpen",
  },
] as const;

export const writingModes = {
  everyday: {
    label: "Everyday",
    hint: "Messages, notes, social posts",
  },
  email: {
    label: "Email",
    hint: "Greetings, tone and politeness",
  },
  academic: {
    label: "Academic",
    hint: "Formal register and cohesion",
  },
  business: {
    label: "Business",
    hint: "Clear, concise and professional",
  },
  creative: {
    label: "Creative",
    hint: "Stories and descriptions",
  },
  exam: {
    label: "Exam practice",
    hint: "Task, organisation, range, accuracy",
  },
  grammar: {
    label: "Grammar only",
    hint: "Grammar, spelling, punctuation",
  },
} as const;

export const tutorPrompts = {
  beginner: [
    {
      title: "How do I introduce myself?",
      body: "Simple phrases for meeting people",
    },
    {
      title: "What is the difference between “a” and “an”?",
      body: "With easy examples",
    },
    {
      title: "Can you correct this: “I have 20 years”?",
      body: "Check a sentence",
    },
    {
      title: "Teach me five words for food.",
      body: "New vocabulary",
    },
  ],
  other: [
    {
      title: "When do I use the present perfect?",
      body: "A clear explanation with examples",
    },
    {
      title: "What is the difference between “make” and “do”?",
      body: "Common word pairs",
    },
    {
      title: "Can you check this sentence: “I am agree with you”?",
      body: "Spot the mistake",
    },
    {
      title: "Give me three phrasal verbs with “get”.",
      body: "Everyday English",
    },
  ],
} as const;

export const scenarioCategories = [
  {
    id: "all",
    label: "All",
  },
  {
    id: "social",
    label: "Social",
  },
  {
    id: "daily",
    label: "Daily life",
  },
  {
    id: "travel",
    label: "Travel",
  },
  {
    id: "work",
    label: "Work",
  },
  {
    id: "health",
    label: "Health",
  },
] as const;

export const activityLabels = {
  lesson: "Lesson",
  review: "Review",
  flashcards: "Flashcards",
  conversation: "Conversation",
  tutor: "AI tutor",
  writing: "Writing",
  placement: "Level check",
  speaking: "Speaking",
  listening: "Listening",
  grammar: "Grammar practice",
} as const;
