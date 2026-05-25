/** Exact English strings from API/seed → Hindi. Unknown strings pass through. */
const EN_TO_HI: Record<string, string> = {
    // —— Module titles & timelines ——
    'Module 00': 'मॉड्यूल 00',
    'Module 01': 'मॉड्यूल 01',
    'Module 02': 'मॉड्यूल 02',
    'Module 03': 'मॉड्यूल 03',
    'Module 04': 'मॉड्यूल 04',
    'Module 05': 'मॉड्यूल 05',
    'Module 06': 'मॉड्यूल 06',
    'Module 07': 'मॉड्यूल 07',
    'Module 08': 'मॉड्यूल 08',
    Bonus: 'बोनस',
    'Week 01 to 03': 'सप्ताह 01 से 03',
    'Week 04 to 05': 'सप्ताह 04 से 05',
    'Week 06': 'सप्ताह 06',

    // —— Module descriptions (seed) ——
    'Course onboarding and orientation.': 'कोर्स ऑनबोर्डिंग और ओरिएंटेशन।',
    'Foundational phonetics and number systems.': 'बुनियादी ध्वन्यात्मकता और संख्या प्रणाली।',
    'Advanced pronunciation and sound patterns.': 'उन्नत उच्चारण और ध्वनि पैटर्न।',
    'Core grammar classification and lexical understanding.': 'मूल व्याकरण वर्गीकरण और शाब्दिक समझ।',
    'Parts of speech: nouns, pronouns, and verbs.': 'वाक्य के भाग: संज्ञा, सर्वनाम और क्रिया।',
    'Descriptive and modifying language elements.': 'वर्णनात्मक और संशोधक भाषा तत्व।',
    'Sentence connectors and expressive words.': 'वाक्य कनेक्टर और अभिव्यंजक शब्द।',
    'Sentence framing and article usage.': 'वाक्य रचना और आर्टिकल का प्रयोग।',
    'Tense mastery and practical usage.': 'काल पर महारत और व्यावहारिक उपयोग।',
    'Modals and advanced application patterns.': 'मोडल और उन्नत प्रयोग पैटर्न।',
    'Additional vocabulary and fluency accelerators.': 'अतिरिक्त शब्दावली और धाराप्रवाहता बूस्टर।',

    // —— Chapters (seed + common fallback variants) ——
    Introductions: 'परिचय',
    'Why English?': 'अंग्रेज़ी क्यों?',
    'Meet your coach': 'अपने कोच से मिलें',
    'Who this course is for?': 'यह कोर्स किसके लिए है?',
    'Our Mission': 'हमारा मिशन',
    'Alphabets and phonetics and sounds': 'वर्णमाला, ध्वन्यात्मकता और ध्वनियाँ',
    'Alphabets, phonetics and sounds': 'वर्णमाला, ध्वन्यात्मकता और ध्वनियाँ',
    'Bara-khadi (in English)': 'बारहखड़ी (अंग्रेज़ी में)',
    Counting: 'गिनती',
    'Sequencing / Ranking': 'क्रम / रैंकिंग',
    'Fractions and multiples': 'भिन्न और गुणज',
    'Multiple sounds of consonants - C, G, S, T, etc.': 'व्यंजनों की कई ध्वनियाँ — C, G, S, T, आदि',
    'Multiple sounds of consonants (C, G, S, T, etc.)': 'व्यंजनों की कई ध्वनियाँ (C, G, S, T, आदि)',
    'Silent letters - K, L, B, N, P, etc.': 'मूक अक्षर — K, L, B, N, P, आदि',
    'Silent letters (K, L, B, N, P, etc.)': 'मूक अक्षर (K, L, B, N, P, आदि)',
    'Sounds of vowels - A, E, I, O, U': 'स्वरों की ध्वनियाँ — A, E, I, O, U',
    'Sounds of vowels (A, E, I, O, U)': 'स्वरों की ध्वनियाँ (A, E, I, O, U)',
    'Genders in humans': 'मानव में लिंग',
    'Genders in professions': 'पेशों में लिंग',
    'Genders in animals': 'जानवरों में लिंग',
    'Babies of everyone': 'शिशु/बच्चों के शब्द',
    'Singular and Plural (simple and complex)': 'एकवचन और बहुवचन (सरल और जटिल)',
    'Opposite of verbs': 'क्रियाओं के विलोम',
    'Opposite of nouns and pronouns': 'संज्ञा और सर्वनाम के विलोम',
    'Opposite of adjectives': 'विशेषण के विलोम',
    'Confusing words: Homophones, Homographs, Homonyms':
        'भ्रमकारी शब्द: समोध्वনि, समानलिखित, समरूप शब्द',
    Noun: 'संज्ञा',
    Pronoun: 'सर्वनाम',
    Verb: 'क्रिया',
    Adjective: 'विशेषण',
    Adverb: 'क्रिया विशेषण',
    Conjunctions: 'समुच्चयबोधक',
    Interjections: 'विस्मयादिबोधक',
    Prepositions: 'संबंधबोधक',
    Punctuations: 'विराम चिह्न',
    'Article (A, An, The)': 'आर्टिकल (A, An, The)',
    'Part of Sentences': 'वाक्य के भाग',
    'Form of Sentences': 'वाक्य के प्रकार',
    'Present tense': 'वर्तमान काल',
    'Past Tense': 'भूतकाल',
    'Future Tense': 'भविष्यत् काल',
    'Modals - Can, May, Must, Could, Might, Should, Would, etc.':
        'मोडल — Can, May, Must, Could, Might, Should, Would, आदि',
    'Modals (Can, May, Must, Could, Might, Should, Would, etc.)':
        'मोडल (Can, May, Must, Could, Might, Should, Would, आदि)',
    '3 letter words': '3 अक्षर वाले शब्द',
    '4 letter words': '4 अक्षर वाले शब्द',
    'How to say time in English': 'अंग्रेज़ी में समय कैसे कहें',
    'Common Vocabulary - Kitchen, Living, Transport, Body Parts, Dining, Birds, Animals and 50+ more':
        'सामान्य शब्दावली — रसोई, लिविंग, परिवहन, शरीर के अंग, भोजन, पक्षी, जानवर और 50+',
    'Common Vocabulary: Kitchen, Living, Transport, Body Parts, Dining, Birds, Animals and 50+ more':
        'सामान्य शब्दावली: रसोई, लिविंग, परिवहन, शरीर के अंग, भोजन, पक्षी, जानवर और 50+',

    // —— Subscription plans ——
    'Free Foundation': 'मुफ्त फाउंडेशन',
    'Bronze Content': 'ब्रॉन्ज़ कंटेंट',
    'Silver Content': 'सिल्वर कंटेंट',
    'Gold Professional': 'गोल्ड प्रोफेशनल',
    'Full Course': 'पूरा कोर्स',
    'AI Learning Companion': 'AI लर्निंग कम्पेनियन',
    'Bonus Extras': 'बोनस एक्स्ट्रा',

    'Daily foundational practice with words and phrase building.':
        'शब्दों और वाक्यांश निर्माण के साथ दैनिक बुनियादी अभ्यास।',
    'Reading fluency and essential vocabulary progression.':
        'पढ़ने में धाराप्रवाहता और आवश्यक शब्दावली विकास।',
    'Real-life communication and grammar puzzle practice.':
        'वास्तविक जीवन का संवाद और व्याकरण पज़ल अभ्यास।',
    'Professional communication tracks and AI prompts.':
        'प्रोफेशनल संवाद ट्रैक और AI प्रॉम्प्ट।',
    'Zero to Hero complete curriculum with quizzes and long-form lectures.':
        'क्विज़ और लंबे व्याख्यानों के साथ जीरो टू हीरो पूरा पाठ्यक्रम।',
    'Multilingual AI-guided speaking and typing support.':
        'बहुभाषी AI-निर्देशित बोलने और टाइपिंग सहायता।',
    'Supplemental practice bundle included with paid modules.':
        'भुगतान वाले मॉड्यूल के साथ अतिरिक্ত अभ्यास बंडल।',

    'Daily Word (1000+ words so far)': 'दैनिक शब्द (अब तक 1000+ शब्द)',
    'Phrase Building (500+ phrases)': 'वाक्यांश निर्माण (500+ वाक्यांश)',
    'Daily One Minute Article (300+ stories)': 'दैनिक एक मिनट का लेख (300+ कहानियाँ)',
    'Essential Vocabulary': 'आवश्यक शब्दावली',
    'Practical conversations': 'व्यावहारिक बातचीत',
    'Daily Puzzle: Spot the Correct Sentence': 'दैनिक पज़ल: सही वाक्य चुनें',
    'Daily Puzzle: Correct Use of Grammar': 'दैनिक पज़ल: व्याकरण का सही प्रयोग',
    'Explain Scene/Situation with key words': 'मुख्य शब्दों के साथ दृश्य/स्थिति समझाएँ',
    'Professional Conversations (Airport Immigration, Job Interviews, Client Meetings)':
        'प्रोफेशनल बातचीत (एयरपोर्ट इमिग्रेशन, जॉब इंटरव्यू, क्लाइंट मीटिंग)',
    'Ready-to-Use AI Prompts': 'तत्काल उपयोग के लिए AI प्रॉम्प्ट',
    'Zero to Hero 200 hours of lectures': 'जीरो टू हीरो 200 घंटे व्याख्यान',
    '100 Videos, 08 Modules, 80 Quiz, 200 hours of video': '100 वीडियो, 08 मॉड्यूल, 80 क्विज़, 200 घंटे वीडियो',
    'Phonetics to nouns, pronouns, tenses and advanced modals':
        'ध्वन्यात्मकता से संज्ञा, सर्वनाम, काल और उन्नत मोडल तक',
    'Module-specific quizzes': 'मॉड्यूल-विशिष्ट क्विज़',
    'Life Time Access': 'जीवनभर एक्सेस',
    'Learn in English, Hindi, Hinglish': 'अंग्रेज़ी, हिंदी, हिंग्लिश में सीखें',
    'Speak or Type to learn': 'सीखने के लिए बोलें या टाइप करें',
    'Famous Speeches (Priyanka Chopra, APJ Kalam analysis)':
        'प्रसिद्ध भाषण (प्रियंका चोपड़ा, एपीजे कलाम विश्लेषण)',
    'Song Lyrics (Ed Sheeran lyrics + vocabulary)': 'गाने के बोल (Ed Sheeran बोल + शब्दावली)',
    'Curated Instagram Learning Feeds': 'चयनित इंस्टाग्राम लर्निंग फ़ीड',

    Foundation: 'फाउंडेशन',
    'Best Value': 'सबसे बढ़िया वैल्यू',
    'Free with bundle': 'बंडल के साथ मुफ्त',

    // —— Sub-topic / topic labels sometimes surfaced ——
    Free: 'मुफ्त',
    Bronze: 'ब्रॉन्ज़',
    Silver: 'सिल्वर',
    Gold: 'गोल्ड',
    'AI Learning': 'AI लर्निंग',
    'English Learning': 'अंग्रेज़ी सीखना',

    // —— Offers ——
    'Limited Time Launch Offer': 'सीमित समय लॉन्च ऑफ़र',
    'New Year offer: ₹3999 only (55% off) on all paid modules plus bonus content.':
        'नई साल की पेशकश: सभी पेड मॉड्यूल और बोनस कंटेंट पर केवल ₹3999 (55% छूट)।',
    '7-Day Money Back Guarantee': '7-दिन मनी-बैक गारंटी',
    '100% risk free: no-questions-asked refund + lifetime free updates.':
        '100% जोखिम-मुक्त: बिना सवाल वापसी + लाइफटाइम मुफ्त अपडेट।',

    // —— UI fallbacks ——
    'Module content details available inside the course.': 'मॉड्यूल विवरण कोर्स के अंदर उपलब्ध है।',
    'Structured English learning plan': 'संरचित अंग्रेज़ी लर्निंग प्लान',
    'Guided English learning content': 'गाइडेड अंग्रेज़ी लर्निंग सामग्री',

    Starter: 'स्टार्टर',
    Pro: 'प्रो',
    Team: 'टीम',
    'Perfect to explore Verble': 'Verble खोजने के लिए बढ़िया',
    '3 speeches / month': 'महीने में 3 भाषण',
    'Core AI speechwriter': 'कोर AI स्पीच राइटर',
    'TED-style + pitch templates': 'TED-स्टाइल + पिच टेम्पलेट',
    'For founders & creators': 'संस्थापक और क्रिएटर्स के लिए',
    'Unlimited speeches': 'असीमित भाषण',
    'Advanced persuasion frameworks': 'उन्नत प्रेरणा फ्रेमवर्क',
    'Audience profiles & tone controls': 'दर्शक प्रोफाइल और टोन नियंत्रण',
    'Export to slides & teleprompter': 'स्लाइड और टेलीप्रॉम्प्टर में एक्सपोर्ट',
    'For teams & organizations': 'टीम और संगठनों के लिए',
    'All Pro features': 'सभी प्रो फीचर्स',
    'Team workspaces': 'टीम वर्कस्पेस',
    'Brand voice guardrails': 'ब्रांड वॉइस गार्डरेल',
    'Priority support & onboarding': 'प्रायोरिटी सपोर्ट और ऑनबोर्डिंग',
};

export function translateCatalogEnToHi(text: string, lang: string): string {
    if (lang !== 'hi' || !text) return text;
    return EN_TO_HI[text] ?? text;
}
