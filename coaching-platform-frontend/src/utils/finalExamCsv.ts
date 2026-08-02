import { parseCsvToObjects } from './dailyContentBulkCsv';

export type FinalExamImportMode = 'append' | 'upsert' | 'replace';
export type FinalExamDifficulty = 'easy' | 'medium' | 'hard';

export interface FinalExamQuestionInput {
    stableKey: string;
    question: string;
    options: string[];
    correctOption: number;
    explanation?: string;
    category?: string;
    difficulty: FinalExamDifficulty;
    points: number;
    active: boolean;
}

export const FINAL_EXAM_COLUMNS = [
    'stable_key',
    'question',
    'option_1',
    'option_2',
    'option_3',
    'option_4',
    'option_5',
    'option_6',
    'correct_option',
    'explanation',
    'category',
    'difficulty',
    'points',
    'active',
] as const;

const csvCell = (value: string) =>
    /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

export function finalExamTemplateCsv(): string {
    const rows = [
        [...FINAL_EXAM_COLUMNS],
        [
            'grammar-past-001',
            'Which sentence uses the simple past correctly?',
            'She go yesterday.',
            'She went yesterday.',
            'She gone yesterday.',
            '',
            '',
            '',
            '2',
            'Went is the simple past of go.',
            'Grammar',
            'medium',
            '1',
            'yes',
        ],
    ];
    return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

const parseBoolean = (value: string): boolean | null => {
    const normalized = value.trim().toLowerCase();
    if (['yes', 'true', '1', 'active'].includes(normalized)) return true;
    if (['no', 'false', '0', 'inactive'].includes(normalized)) return false;
    return null;
};

export interface FinalExamCsvValidation {
    ok: boolean;
    errors: string[];
    questions: FinalExamQuestionInput[];
}

export function validateFinalExamCsv(csvText: string): FinalExamCsvValidation {
    let rows: Record<string, string>[];
    try {
        rows = parseCsvToObjects(csvText.replace(/^\uFEFF/, '')).rows;
    } catch (error) {
        return { ok: false, errors: [error instanceof Error ? error.message : 'Could not parse CSV.'], questions: [] };
    }
    if (!rows.length) return { ok: false, errors: ['No question rows found.'], questions: [] };

    const errors: string[] = [];
    const headers = Object.keys(rows[0]);
    const missing = FINAL_EXAM_COLUMNS.filter((column) => !headers.includes(column));
    const extras = headers.filter((header) => !FINAL_EXAM_COLUMNS.includes(header as typeof FINAL_EXAM_COLUMNS[number]));
    if (missing.length) errors.push(`Missing required column(s): ${missing.join(', ')}`);
    if (extras.length) errors.push(`Unknown column(s): ${extras.join(', ')}`);
    if (errors.length) return { ok: false, errors, questions: [] };

    const seenKeys = new Set<string>();
    const questions: FinalExamQuestionInput[] = [];
    rows.forEach((row, index) => {
        const line = index + 2;
        const stableKey = row.stable_key.trim();
        if (!stableKey || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,79}$/.test(stableKey)) {
            errors.push(`Row ${line}: stable_key must be 3–80 letters, numbers, dots, dashes, or underscores`);
        } else if (seenKeys.has(stableKey)) {
            errors.push(`Row ${line}: duplicate stable_key "${stableKey}"`);
        }
        seenKeys.add(stableKey);

        const question = row.question.trim();
        if (!question) errors.push(`Row ${line}: question is required`);
        const rawOptions = [1, 2, 3, 4, 5, 6].map((number) => row[`option_${number}`].trim());
        let foundGap = false;
        rawOptions.forEach((option, optionIndex) => {
            if (!option) foundGap = true;
            else if (foundGap) errors.push(`Row ${line}: options must be contiguous; option_${optionIndex + 1} follows a blank option`);
        });
        const options = rawOptions.filter(Boolean);
        if (options.length < 2) errors.push(`Row ${line}: at least two options are required`);

        const correct = Number(row.correct_option);
        if (!Number.isInteger(correct) || correct < 1 || correct > options.length) {
            errors.push(`Row ${line}: correct_option must identify one of the filled options`);
        }
        const difficulty = row.difficulty.trim().toLowerCase();
        if (!['easy', 'medium', 'hard'].includes(difficulty)) {
            errors.push(`Row ${line}: difficulty must be easy, medium, or hard`);
        }
        const points = Number(row.points);
        if (!Number.isInteger(points) || points < 1 || points > 100) {
            errors.push(`Row ${line}: points must be a whole number from 1–100`);
        }
        const active = parseBoolean(row.active);
        if (active === null) errors.push(`Row ${line}: active must be yes/no or true/false`);

        questions.push({
            stableKey,
            question,
            options,
            correctOption: correct - 1,
            explanation: row.explanation.trim() || undefined,
            category: row.category.trim() || undefined,
            difficulty: difficulty as FinalExamDifficulty,
            points,
            active: active ?? false,
        });
    });
    return { ok: errors.length === 0, errors, questions: errors.length ? [] : questions };
}

export function questionsToFinalExamCsv(questions: FinalExamQuestionInput[]): string {
    const rows = questions.map((item) => [
        item.stableKey,
        item.question,
        ...Array.from({ length: 6 }, (_, index) => item.options[index] || ''),
        String(item.correctOption + 1),
        item.explanation || '',
        item.category || '',
        item.difficulty,
        String(item.points),
        item.active ? 'yes' : 'no',
    ]);
    return [[...FINAL_EXAM_COLUMNS], ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}
