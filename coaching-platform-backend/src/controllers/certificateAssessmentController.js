// src/controllers/certificateAssessmentController.js
import asyncHandler from 'express-async-handler';
import CertificateAssessment from '../models/CertificateAssessment.js';
import CertificateAssessmentSubmission from '../models/CertificateAssessmentSubmission.js';

/**
 * @desc    Get certificate assessment (without answers)
 * @route   GET /api/certificate-assessment
 * @access  Private
 */
export const getCertificateAssessment = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const assessment = await CertificateAssessment.findOne({ isActive: true });

    if (!assessment) {
        res.status(404);
        throw new Error('Certificate assessment not found');
    }

    // Check if user already has a passing submission
    const existingSubmission = await CertificateAssessmentSubmission.findOne({
        user: userId,
        passed: true,
    });

    if (existingSubmission) {
        res.status(200).json({
            status: 'success',
            data: {
                assessment: {
                    _id: assessment._id,
                    title: assessment.title,
                    description: assessment.description,
                    totalQuestions: assessment.questions.length,
                    passingScore: assessment.passingScore,
                    timeLimit: assessment.timeLimit,
                },
                alreadyPassed: true,
                existingSubmission: {
                    score: existingSubmission.score,
                    submittedAt: existingSubmission.submittedAt,
                    certificateGenerated: existingSubmission.certificateGenerated,
                },
            },
        });
        return;
    }

    // Remove correct answers for students
    const assessmentForStudent = {
        _id: assessment._id,
        title: assessment.title,
        description: assessment.description,
        questions: assessment.questions.map(q => ({
            _id: q._id,
            question: q.question,
            options: q.options,
            category: q.category,
            difficulty: q.difficulty,
            points: q.points,
        })),
        totalQuestions: assessment.questions.length,
        passingScore: assessment.passingScore,
        timeLimit: assessment.timeLimit,
    };

    res.status(200).json({
        status: 'success',
        data: {
            assessment: assessmentForStudent,
            alreadyPassed: false,
        },
    });
});

/**
 * @desc    Submit certificate assessment
 * @route   POST /api/certificate-assessment/submit
 * @access  Private
 */
export const submitCertificateAssessment = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { answers, timeSpent } = req.body;

    const assessment = await CertificateAssessment.findOne({ isActive: true });
    if (!assessment) {
        res.status(404);
        throw new Error('Certificate assessment not found');
    }

    // Check if user already passed
    const existingPassedSubmission = await CertificateAssessmentSubmission.findOne({
        user: userId,
        passed: true,
    });

    if (existingPassedSubmission) {
        res.status(400);
        throw new Error('You have already passed the certificate assessment');
    }

    // Validate answers
    if (!Array.isArray(answers) || answers.length !== assessment.questions.length) {
        res.status(400);
        throw new Error('Invalid answers format or count');
    }

    // Grade the assessment
    let correctAnswers = 0;
    let totalPoints = 0;
    const gradedAnswers = answers.map((answer, index) => {
        const question = assessment.questions[index];
        const isCorrect = answer.selectedAnswer === question.correctAnswer;
        const pointsEarned = isCorrect ? question.points : 0;

        if (isCorrect) {
            correctAnswers++;
            totalPoints += pointsEarned;
        }

        return {
            questionId: question._id,
            selectedAnswer: answer.selectedAnswer,
            isCorrect,
            pointsEarned,
        };
    });

    const totalPossiblePoints = assessment.questions.reduce((sum, q) => sum + q.points, 0);
    const score = totalPossiblePoints > 0 
        ? Math.round((totalPoints / totalPossiblePoints) * 100)
        : 0;
    const passed = score >= assessment.passingScore;

    // Update or create submission
    let submission = await CertificateAssessmentSubmission.findOne({ user: userId });
    
    if (submission) {
        // Update existing submission (retake)
        submission.assessment = assessment._id;
        submission.answers = gradedAnswers;
        submission.totalQuestions = assessment.questions.length;
        submission.correctAnswers = correctAnswers;
        submission.totalPoints = totalPoints;
        submission.score = score;
        submission.passed = passed;
        submission.timeSpent = timeSpent || 0;
        submission.submittedAt = new Date();
        await submission.save();
    } else {
        // Create new submission
        submission = await CertificateAssessmentSubmission.create({
            user: userId,
            assessment: assessment._id,
            answers: gradedAnswers,
            totalQuestions: assessment.questions.length,
            correctAnswers,
            totalPoints,
            score,
            passed,
            timeSpent: timeSpent || 0,
        });
    }

    res.status(200).json({
        status: 'success',
        data: {
            submission: {
                _id: submission._id,
                score,
                passed,
                correctAnswers,
                totalQuestions: assessment.questions.length,
                answers: gradedAnswers.map(a => ({
                    questionId: a.questionId,
                    isCorrect: a.isCorrect,
                    pointsEarned: a.pointsEarned,
                })),
            },
        },
    });
});

/**
 * @desc    Get user's assessment submission with correct answers
 * @route   GET /api/certificate-assessment/submission
 * @access  Private
 */
export const getAssessmentSubmission = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const submission = await CertificateAssessmentSubmission.findOne({ user: userId })
        .populate('assessment', 'title questions passingScore');

    if (!submission) {
        res.status(404);
        throw new Error('No assessment submission found');
    }

    // Include correct answers and explanations
    const assessment = submission.assessment;
    const detailedAnswers = submission.answers.map(subAnswer => {
        const question = assessment.questions.find(q => q._id.toString() === subAnswer.questionId.toString());
        return {
            questionId: subAnswer.questionId,
            question: question ? question.question : '',
            options: question ? question.options : [],
            selectedAnswer: subAnswer.selectedAnswer,
            correctAnswer: question ? question.correctAnswer : null,
            isCorrect: subAnswer.isCorrect,
            pointsEarned: subAnswer.pointsEarned,
            explanation: question ? question.explanation : '',
            category: question ? question.category : '',
            difficulty: question ? question.difficulty : '',
        };
    });

    res.status(200).json({
        status: 'success',
        data: {
            submission: {
                _id: submission._id,
                score: submission.score,
                passed: submission.passed,
                correctAnswers: submission.correctAnswers,
                totalQuestions: submission.totalQuestions,
                answers: detailedAnswers,
                submittedAt: submission.submittedAt,
                certificateGenerated: submission.certificateGenerated,
            },
        },
    });
});
