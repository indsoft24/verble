import { parseCsvToObjects } from './dailyContentBulkCsv';
import type { QuizQuestionInput } from '../services/moduleQuizAdminService';

export interface ModuleQuizBulkColumn {
    key: string;
    label: string;
    required: boolean;
    hint?: string;
    formField?: string;
}

export const MODULE_QUIZ_COLUMNS: ModuleQuizBulkColumn[] = [
    { key: 'quiz_title', label: 'quiz_title', required: true, formField: 'Quiz title (first row)' },
    { key: 'quiz_description', label: 'quiz_description', required: false, formField: 'Description' },
    { key: 'passing_score', label: 'passing_score', required: false, hint: '0–100, default 70', formField: 'Passing score %' },
    { key: 'is_active', label: 'is_active', required: false, hint: 'yes/no, default yes', formField: 'Active' },
    { key: 'question', label: 'question', required: true, formField: 'Question text' },
    { key: 'option_1', label: 'option_1', required: true, formField: 'Option 1' },
    { key: 'option_2', label: 'option_2', required: true, formField: 'Option 2' },
    { key: 'option_3', label: 'option_3', required: false, formField: 'Option 3' },
    { key: 'option_4', label: 'option_4', required: false, formField: 'Option 4' },
    { key: 'option_5', label: 'option_5', required: false, formField: 'Option 5' },
    { key: 'option_6', label: 'option_6', required: false, formField: 'Option 6' },
    { key: 'correct_option', label: 'correct_option', required: true, hint: '1-based (1 = option_1)', formField: 'Correct option' },
    { key: 'explanation', label: 'explanation', required: false, formField: 'Explanation' },
    { key: 'question_points', label: 'question_points', required: false, hint: 'default 1', formField: 'Points' },
];

const EXAMPLE_ROWS = [
    MODULE_QUIZ_COLUMNS.map((c) => c.label),
    [
        'Module 00 Check',
        'Review videos',
        '70',
        'yes',
        'What is the past tense of go?',
        'goed',
        'went',
        'goes',
        'going',
        '',
        '',
        '2',
        'Use went for simple past',
        '1',
    ],
    [
        '',
        '',
        '',
        '',
        'Which word fits?',
        'quick',
        'slow',
        '',
        '',
        '',
        '',
        '1',
        '',
        '1',
    ],
];

function escapeCsvCell(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

export function moduleQuizTemplateCsv(): string {
    return EXAMPLE_ROWS.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
}

function parseBoolActive(value: string): boolean {
    const v = (value ?? '').trim().toLowerCase();
    if (!v) return true;
    if (['no', 'false', '0', 'inactive'].includes(v)) return false;
    return true;
}

export interface ModuleQuizImportPayload {
    title: string;
    description: string;
    passingScore: number;
    isActive: boolean;
    questions: QuizQuestionInput[];
}

export interface ModuleQuizBulkValidation {
    ok: boolean;
    errors: string[];
    payload: ModuleQuizImportPayload | null;
}

export function validateModuleQuizCsv(csvText: string): ModuleQuizBulkValidation {
    const errors: string[] = [];
    let rows: Record<string, string>[];
    try {
        const parsed = parseCsvToObjects(csvText);
        rows = parsed.rows;
    } catch (e: unknown) {
        return {
            ok: false,
            errors: [e instanceof Error ? e.message : 'Could not parse CSV.'],
            payload: null,
        };
    }

    if (rows.length === 0) {
        return { ok: false, errors: ['No question rows found.'], payload: null };
    }

    const allowed = new Set(MODULE_QUIZ_COLUMNS.map((c) => c.key));
    const headers = Object.keys(rows[0] ?? {});
    const missingRequired = MODULE_QUIZ_COLUMNS.filter((c) => c.required && !headers.includes(c.key)).map(
        (c) => c.label
    );
    if (missingRequired.length) {
        errors.push(`Missing required column(s): ${missingRequired.join(', ')}`);
    }
    const extras = headers.filter((h) => h && !allowed.has(h));
    if (extras.length) {
        errors.push(`Unknown column(s): ${extras.join(', ')}`);
    }
    if (errors.length) return { ok: false, errors, payload: null };

    let title = '';
    let description = '';
    let passingScore = 70;
    let isActive = true;

    const questions: QuizQuestionInput[] = [];

    rows.forEach((row, idx) => {
        const line = idx + 2;
        if ((row.quiz_title ?? '').trim() && !title) {
            title = (row.quiz_title ?? '').trim();
        }
        if ((row.quiz_description ?? '').trim() && !description) {
            description = (row.quiz_description ?? '').trim();
        }
        const ps = (row.passing_score ?? '').trim();
        if (ps && idx === 0) {
            const n = Number(ps);
            if (Number.isNaN(n) || n < 0 || n > 100) {
                errors.push(`Row ${line}: passing_score must be 0–100`);
            } else {
                passingScore = n;
            }
        }
        if ((row.is_active ?? '').trim() && idx === 0) {
            isActive = parseBoolActive(row.is_active);
        }

        const questionText = (row.question ?? '').trim();
        if (!questionText) {
            errors.push(`Row ${line}: question is required`);
            return;
        }

        const optionKeys = ['option_1', 'option_2', 'option_3', 'option_4', 'option_5', 'option_6'] as const;
        const options = optionKeys.map((k) => (row[k] ?? '').trim()).filter(Boolean);
        if (options.length < 2) {
            errors.push(`Row ${line}: at least 2 options (option_1, option_2, …) must be filled`);
            return;
        }

        const correctRaw = (row.correct_option ?? '').trim();
        const correctOption = parseInt(correctRaw, 10);
        if (!correctRaw || Number.isNaN(correctOption) || correctOption < 1 || correctOption > options.length) {
            errors.push(
                `Row ${line}: correct_option must be 1–${options.length} (which option is correct)`
            );
            return;
        }

        const pointsRaw = (row.question_points ?? '').trim();
        let points = 1;
        if (pointsRaw) {
            const p = parseInt(pointsRaw, 10);
            if (Number.isNaN(p) || p < 1) {
                errors.push(`Row ${line}: question_points must be a positive number`);
                return;
            }
            points = p;
        }

        questions.push({
            question: questionText,
            options,
            correctAnswer: correctOption - 1,
            explanation: (row.explanation ?? '').trim() || undefined,
            points,
        });
    });

    if (!title) {
        errors.push('quiz_title is required on the first row');
    }
    if (questions.length === 0 && errors.length === 0) {
        errors.push('At least one question row is required');
    }

    if (errors.length) {
        return { ok: false, errors, payload: null };
    }

    return {
        ok: true,
        errors: [],
        payload: {
            title,
            description,
            passingScore,
            isActive,
            questions,
        },
    };
}
