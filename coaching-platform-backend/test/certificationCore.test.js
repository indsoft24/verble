import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCertificateNumber, safeNumberToken } from '../src/services/certificateNumberService.js';
import { gradeAttemptSnapshot, snapshotQuestion } from '../src/services/finalAssessmentService.js';

test('certificate number templates are deterministic and padded', () => {
    const number = formatCertificateNumber({
        settings: {
            template: '{PREFIX}/{YEAR}/{COURSE}/{MODULE}/{SEQUENCE}',
            prefix: 'mod',
            padding: 5,
        },
        sequence: 42,
        date: new Date('2026-07-19T00:00:00Z'),
        course: { title: 'English Pro' },
        module: { title: 'Speaking & Listening' },
    });
    assert.equal(number, 'MOD/2026/ENGLISH-PRO/SPEAKING-LISTENING/00042');
    assert.equal(safeNumberToken('../../ unsafe value'), 'UNSAFE-VALUE');
});

test('question snapshot retains answer mapping without option shuffle', () => {
    const snapshot = snapshotQuestion(
        {
            _id: 'question-id',
            prompt: 'Pick B',
            options: ['A', 'B', 'C'],
            correctOption: 1,
            explanation: 'B is correct',
            points: 2,
        },
        false
    );
    assert.deepEqual(snapshot.options, ['A', 'B', 'C']);
    assert.equal(snapshot.correctOption, 1);
});

test('snapshot grading uses weighted immutable answers', () => {
    const grade = gradeAttemptSnapshot(
        [
            { correctOption: 0, points: 1 },
            { correctOption: 2, points: 3 },
        ],
        [0, 1]
    );
    assert.deepEqual(grade, {
        earnedPoints: 1,
        totalPoints: 4,
        correctCount: 1,
        score: 25,
    });
});
