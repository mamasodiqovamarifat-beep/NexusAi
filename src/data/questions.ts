import { MathQuestion, EnglishQuestion, WritingTask } from '../types';

// Generators or static lists for age groups: '5-8', '9-12', '13+'

export const MATH_QUESTIONS: Record<string, MathQuestion[]> = {
  '5-8': [
    {
      id: 'm_5_1',
      question: '🍎🍎 + 🍎🍎 = ?',
      options: ['3', '4', '5', '6'],
      answer: '4',
      type: 'multiple',
      itemsCount: 4,
      promptUz: 'Olmalarni sanang va javobni toping!',
      voicePrompt: 'Two apples plus two apples makes how many apples?'
    },
    {
      id: 'm_5_2',
      question: '🍌🍌🍌 - 🍌 = ?',
      options: ['1', '2', '3', '4'],
      answer: '2',
      type: 'multiple',
      itemsCount: 2,
      promptUz: 'Bananlar ayirmasini hisoblang!',
      voicePrompt: 'Three bananas minus one banana is how many?'
    },
    {
      id: 'm_5_3',
      question: 'Sanang: ⭐⭐⭐⭐⭐',
      options: ['3', '4', '5', '6'],
      answer: '5',
      type: 'count',
      itemsCount: 5,
      promptUz: 'Yulduzchalarni sanang!',
      voicePrompt: 'Count the stars'
    },
    {
      id: 'm_5_4',
      question: '3 + 2 = ?',
      options: ['4', '5', '6', '7'],
      answer: '5',
      type: 'multiple',
      promptUz: '3 ga 2 ni qo\'shing',
      voicePrompt: 'What is three plus two?'
    },
    {
      id: 'm_5_5',
      question: '🧩🧩🧩🧩🧩🧩 - 🧩🧩 = ?',
      options: ['3', '4', '5', '6'],
      answer: '4',
      type: 'multiple',
      itemsCount: 4,
      promptUz: 'Kubiklarni hisoblang',
      voicePrompt: 'What is six minus two?'
    }
  ],
  '9-12': [
    {
      id: 'm_9_1',
      question: '7 x 8 = ?',
      options: ['54', '56', '64', '49'],
      answer: '56',
      type: 'multiple',
      promptUz: 'Ko\'paytirish jadvalini eslang!',
      voicePrompt: 'What is seven times eight?'
    },
    {
      id: 'm_9_2',
      question: '45 ÷ 5 = ?',
      options: ['7', '8', '9', '10'],
      answer: '9',
      type: 'multiple',
      promptUz: 'Bo\'lish amalini bajaring:',
      voicePrompt: 'What is forty five divided by five?'
    },
    {
      id: 'm_9_3',
      question: 'Kasrni toping: 1/4 + 2/4 = ?',
      options: ['1/2', '3/4', '1', '3/8'],
      answer: '3/4',
      type: 'multiple',
      promptUz: 'Umumiy maxrajli kasrlarni qo\'shish',
      voicePrompt: 'What is one fourth plus two fourths?'
    },
    {
      id: 'm_9_4',
      question: 'Tenglamani yeching: 3x = 27. x = ?',
      options: ['7', '8', '9', '6'],
      answer: '9',
      type: 'multiple',
      promptUz: 'Noma\'lum son x ni toping:',
      voicePrompt: 'Solve for x: three x equals twenty seven. What is x?'
    },
    {
      id: 'm_9_5',
      question: 'Nailaning 12 ta qalami bor. Samira senga yana 5 ta berdi, va sen 3 tasini yo\'qotding. Qancha qalam qoldi?',
      options: ['12', '14', '15', '17'],
      answer: '14',
      type: 'multiple',
      promptUz: 'Matnli masalani diqqat bilan o\'qing:',
      voicePrompt: 'Naila has twelve pencils. Samira gives her five more, and she loses three. How many count left?'
    }
  ],
  '13+': [
    {
      id: 'm_13_1',
      question: 'Tenglamani yeching: 2x + 11 = 35. x = ?',
      options: ['10', '12', '14', '16'],
      answer: '12',
      type: 'multiple',
      promptUz: 'Tenglamani yechib x ni toping:',
      voicePrompt: 'Solve: two x plus eleven equals thirty five'
    },
    {
      id: 'm_13_2',
      question: 'Kvadrat tenglamaning diskriminantini toping: x² - 5x + 6 = 0',
      options: ['1', '5', '12', '25'],
      answer: '1',
      type: 'multiple',
      promptUz: 'Diskriminant D = b² - 4ac formulasi orqali toping:',
      voicePrompt: 'Find the discriminant of x squared minus five x plus six equals zero'
    },
    {
      id: 'm_13_3',
      question: 'Agar burchak burchaklar yig\'indisi uchburchakda 180° bo\'lsa, teng yonli uchburchakning uchidagi burchak 80° bo\'lsa, qolgan asosi burchaklari necha daraja?',
      options: ['40°', '50°', '60°', '45°'],
      answer: '50°',
      type: 'multiple',
      promptUz: 'Uchburchak ichki burchaklari qonunidan foydalaning:',
      voicePrompt: 'A triangle has a peak angle of eighty degrees. What is each base angle?'
    },
    {
      id: 'm_13_4',
      question: 'Logarifmni hisoblang: log₂(16) = ?',
      options: ['2', '3', '4', '8'],
      answer: '4',
      type: 'multiple',
      promptUz: 'Asos 2 bo\'lgan logarifm',
      voicePrompt: 'What is log base two of sixteen?'
    },
    {
      id: 'm_13_5',
      question: 'Ehtimollik: Qutida 3 ta qizil va 5 ta ko\'k tosh bor. Tasodifiy olingan toshning qizil bo\'lish ehtimoli qancha?',
      options: ['3/5', '3/8', '5/8', '1/2'],
      answer: '3/8',
      type: 'multiple',
      promptUz: 'Hodisa ehtimolligini toping:',
      voicePrompt: 'A box has three red and five blue balls. What is the probability of picking a red one?'
    }
  ]
};

export const ENGLISH_QUESTIONS: Record<string, EnglishQuestion[]> = {
  '5-8': [
    {
      id: 'e_5_1',
      question: 'Which animal makes "Woof Woof" sound?',
      options: ['Cat 🐱', 'Dog 🐶', 'Cow 🐮', 'Lion 🦁'],
      answer: 'Dog 🐶',
      type: 'word',
      promptUz: 'Qaysi uy hayvoni akillaydi?',
      voicePrompt: 'Which animal says woof woof?'
    },
    {
      id: 'e_5_2',
      question: 'What is the color of an Apple 🍎?',
      options: ['Green 🍏', 'Blue 🔵', 'Red 🔴', 'Yellow 🟡'],
      answer: 'Red 🔴',
      type: 'word',
      promptUz: 'Olma qaysi rangda bo\'ladi?',
      voicePrompt: 'What is the standard color of an apple?'
    },
    {
      id: 'e_5_3',
      question: 'Complete: "A, B, C, ____, E, F"',
      options: ['G', 'M', 'D', 'H'],
      answer: 'D',
      type: 'grammar',
      promptUz: 'Alifboda tushib qolgan harfni toping:',
      voicePrompt: 'What letter comes after C?'
    },
    {
      id: 'e_5_4',
      question: 'Identify the fruit:',
      options: ['Potato 🥔', 'Onion 🧅', 'Banana 🍌', 'Carrot 🥕'],
      answer: 'Banana 🍌',
      type: 'word',
      promptUz: 'Meva turini tanlang:',
      voicePrompt: 'Which of these is a sweet yellow fruit?'
    }
  ],
  '9-12': [
    {
      id: 'e_9_1',
      question: 'Choose the correct verb: "She ______ to school every day."',
      options: ['go', 'goes', 'going', 'went'],
      answer: 'goes',
      type: 'grammar',
      promptUz: 'Lakonik zamon qoidalariga rioya qiling:',
      voicePrompt: 'Complete the sentence: She blank to school every day.'
    },
    {
      id: 'e_9_2',
      question: 'Rearrange to make a sentence: "cat / on / sat / the / mat / the"',
      options: [
        'The cat sat on the mat.',
        'The mat sat on the cat.',
        'Cat the sat on the mat.',
        'The sat mat on the cat.'
      ],
      answer: 'The cat sat on the mat.',
      type: 'sentence',
      promptUz: 'So\'zlarni tartibga solib to\'g\'ri gap tuzing:',
      voicePrompt: 'Rearrange words to make a proper sentence.'
    },
    {
      id: 'e_9_3',
      question: 'What is the opposite (antonym) of "HAPPY"?',
      options: ['Cheerful', 'Sad', 'Angry', 'Sleepy'],
      answer: 'Sad',
      type: 'word',
      promptUz: '"Happy" (baxtli) so\'ziga teskari ma\'noni toping:',
      voicePrompt: 'What is the opposite of happy?'
    },
    {
      id: 'e_9_4',
      question: 'Complete: "If it rains tomorrow, we _______ stay at home."',
      options: ['would', 'will', 'are', 'was'],
      answer: 'will',
      type: 'grammar',
      promptUz: 'Shartli gaplar (Conditionals) qoidasi:',
      voicePrompt: 'If it rains tomorrow, we blank stay at home.'
    }
  ],
  '13+': [
    {
      id: 'e_13_1',
      question: 'Select the sentence with correct punctuation:',
      options: [
        'Although she was tired, she completed her writing homework.',
        'Although she was tired completed her writing homework.',
        'Although she was tired; completed her writing homework.',
        'She completed her writing homework although, she was tired.'
      ],
      answer: 'Although she was tired, she completed her writing homework.',
      type: 'grammar',
      promptUz: 'To\'g\'ri tinish belgilari va bog\'lovchilarni toping:',
      voicePrompt: 'Choose the grammatically correct sentence.'
    },
    {
      id: 'e_13_2',
      question: 'Define "OBSTINATE":',
      options: ['Very intelligent', 'Stubborn and refusing to change', 'Soft-hearted', 'Extremely fast'],
      answer: 'Stubborn and refusing to change',
      type: 'word',
      promptUz: '"Obstinate" so\'zining aniq ma\'nosini toping:',
      voicePrompt: 'What does the word obstinate mean?'
    },
    {
      id: 'e_13_3',
      question: 'Fill in the blank: "By this time next year, I ________ my studies."',
      options: ['will finish', 'will have finished', 'am finishing', 'finished'],
      answer: 'will have finished',
      type: 'grammar',
      promptUz: 'Future Perfect zamon shaklini toping:',
      voicePrompt: 'By this time next year, I blank my studies.'
    },
    {
      id: 'e_13_4',
      question: 'Reading passage: "The Great Wall of China was built over centuries to protect against invasions." Why was the wall built?',
      options: ['To attract tourists', 'To protect against invasions', 'To divide rivers', 'For trade routes'],
      answer: 'To protect against invasions',
      type: 'grammar',
      promptUz: 'Matnni tushunish bo\'yicha javob bering:',
      voicePrompt: 'Why was the Great Wall of China built?'
    }
  ]
};

export const WRITING_TASKS: Record<string, WritingTask[]> = {
  '5-8': [
    {
      id: 'w_5_1',
      topic: 'My Pet',
      uzTopic: 'Mening sevimli jonivorim',
      description: 'Write about your dog, cat, or parrot. What is its name and color?',
      uzDescription: 'Sevimli hayvoningiz haqida yozing. Uning ismi kim? U qanaqa rangda? (Kamida 1-2 gap yozing)',
      suggestedWords: ['cat', 'dog', 'cute', 'my', 'toy', 'play']
    },
    {
      id: 'w_5_2',
      topic: 'My Family',
      uzTopic: 'Mening oilam',
      description: 'Write a short sentence about your mother or father.',
      uzDescription: 'Oila a\'zolaringiz haqida shirin gap yozing. Ularni qanchalik yaxshi ko\'rasiz?',
      suggestedWords: ['love', 'family', 'mother', 'father', 'happy']
    }
  ],
  '9-12': [
    {
      id: 'w_9_1',
      topic: 'My Favorite Hobby',
      uzTopic: 'Mening sevimli mashg‘ulotim',
      description: 'Write 3-4 sentences about what you love to do in your free time (football, reading books, drawing, singing). Why do you like it?',
      uzDescription: 'Bo\'sh vaqtingizda nima qilishni yoqtirasiz? Sport, rasm chizish yoki kitob o\'qish? Yoqtirishingiz sabablarini yozing.',
      suggestedWords: ['hobby', 'free time', 'because', 'joy', 'learn', 'every day']
    },
    {
      id: 'w_9_2',
      topic: 'The Best Day of Summer',
      uzTopic: 'Yoz oromgohi yoki ajoyib yoz kuni',
      description: 'Describe an outstanding summer day. Where did you go and whom did you spend it with?',
      uzDescription: 'Yozgi eng quvnoq kuni xotirasini tasvirlang. Qayerga bordingiz? Kimlar bilan sayr qildingiz?',
      suggestedWords: ['summer', 'friends', 'sunny', 'park', 'swimming', 'happy']
    }
  ],
  '13+': [
    {
      id: 'w_13_1',
      topic: 'The Role of Artificial Intelligence in Education',
      uzTopic: 'Kompyuterlar va Sun’iy intellektning ta’limdagi o‘rni',
      description: 'Write an argumentative mini-essay about whether AI tools help or hinder student learning. Provide examples.',
      uzDescription: 'Sun\'iy intellekt va robotlar bolalar ta\'limini yaxshilaydimi yoki dangasa qilib qo\'yadimi? Muhokama insho yozing (kamida 4-5 ta gap).',
      suggestedWords: ['artificial intelligence', 'advantages', 'critical thinking', 'development', 'technology', 'students']
    },
    {
      id: 'w_13_2',
      topic: 'How to Protect Our Planet Green',
      uzTopic: 'Ona sayyoramizni yashil saqlash sirlari',
      description: 'Discuss individual actions we can take to combat climate change, such as recycling, planting trees, or reducing plastic.',
      uzDescription: 'Sayyoramizni asrash va ekologiyani yaxshilash uchun odamlar nima qilishi kerak? Daraxt ekish, chiqindi saralash sirlarini bayon qiling.',
      suggestedWords: ['environment', 'pollution', 'recycle', 'protect', 'global warming', 'responsibility']
    }
  ]
};
