import Module from '../models/Module.js';
import ModuleCompletion from '../models/ModuleCompletion.js';
import ModuleQuiz from '../models/ModuleQuiz.js';
import ModuleQuizSubmission from '../models/ModuleQuizSubmission.js';
import FinalAssessmentAttempt from '../models/FinalAssessmentAttempt.js';
import UserSentenceSubmission from '../models/UserSentenceSubmission.js';
import UserStorySubmission from '../models/UserStorySubmission.js';
import UserVocabSubmission from '../models/UserVocabSubmission.js';
import UserSceneSubmission from '../models/UserSceneSubmission.js';
import UserSpeechSubmission from '../models/UserSpeechSubmission.js';
import UserPuzzleSubmission from '../models/UserPuzzleSubmission.js';
import CourseCertificateRule from '../models/CourseCertificateRule.js';
import Course from '../models/Course.js';

const getOrCreateCourseRule = async (courseId) => {
    let rule = await CourseCertificateRule.findOne({ course: courseId });
    if (!rule) {
        rule = await CourseCertificateRule.create({ course: courseId });
    }
    return rule;
};

const lookbackDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
};

const isManualSubmissionSuccess = (doc) => doc.isCorrect === true;
const isManualSubmissionReviewed = (doc) => doc.isCorrect !== null && doc.isCorrect !== undefined;
const isPuzzleSubmissionSuccess = (doc) => {
    const total = doc.answers?.length || 5;
    return (doc.correctCount || 0) / total >= 0.6;
};

async function collectDailySubmissionStats(userId, lookbackDays) {
    const since = lookbackDate(lookbackDays);
    const baseQuery = { userId, createdAt: { $gte: since } };

    const [sentences, stories, vocabs, scenes, speeches, puzzles] = await Promise.all([
        UserSentenceSubmission.find(baseQuery).select('isCorrect createdAt').lean(),
        UserStorySubmission.find(baseQuery).select('isCorrect createdAt').lean(),
        UserVocabSubmission.find(baseQuery).select('isCorrect createdAt').lean(),
        UserSceneSubmission.find(baseQuery).select('isCorrect createdAt').lean(),
        UserSpeechSubmission.find(baseQuery).select('isCorrect createdAt').lean(),
        UserPuzzleSubmission.find({ userId, submittedAt: { $gte: since } }).select('correctCount answers').lean(),
    ]);

    let reviewed = 0;
    let successful = 0;

    const manual = [...sentences, ...stories, ...vocabs, ...scenes, ...speeches];
    manual.forEach((doc) => {
        if (isManualSubmissionReviewed(doc)) {
            reviewed++;
            if (isManualSubmissionSuccess(doc)) successful++;
        }
    });

    puzzles.forEach((doc) => {
        reviewed++;
        if (isPuzzleSubmissionSuccess(doc)) successful++;
    });

    const successPercent = reviewed === 0 ? 0 : Math.round((successful / reviewed) * 100);
    return { reviewed, successful, successPercent };
}

async function collectModuleQuizStats(userId, courseId) {
    const modules = await Module.find({ course: courseId }).select('_id title').lean();
    const moduleIds = modules.map((m) => m._id);
    const activeQuizzes = await ModuleQuiz.find({ module: { $in: moduleIds }, isActive: true }).lean();
    const quizByModule = new Map(activeQuizzes.map((q) => [q.module.toString(), q]));

    const perModule = [];
    let allRequiredPassed = true;
    let scoreSum = 0;
    let scoreCount = 0;

    for (const mod of modules) {
        const quiz = quizByModule.get(mod._id.toString());
        if (!quiz) {
            perModule.push({ moduleId: mod._id, title: mod.title, hasQuiz: false, passed: true, bestScore: null });
            continue;
        }
        const attempts = await ModuleQuizSubmission.find({ user: userId, module: mod._id, quiz: quiz._id })
            .sort({ score: -1 })
            .lean();
        const best = attempts[0];
        const bestScore = best ? best.score : null;
        const passed = attempts.some((a) => a.passed);
        if (!passed) allRequiredPassed = false;
        if (bestScore != null) {
            scoreSum += bestScore;
            scoreCount++;
        }
        perModule.push({
            moduleId: mod._id,
            title: mod.title,
            hasQuiz: true,
            passed,
            bestScore,
            attempts: attempts.length,
        });
    }

    const averageBestScore = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0;
    return { perModule, allRequiredPassed, averageBestScore, modulesWithQuiz: scoreCount };
}

async function collectOverallSubmissionStats(userId, courseId, lookbackDays) {
    const daily = await collectDailySubmissionStats(userId, lookbackDays);
    const quizStats = await collectModuleQuizStats(userId, courseId);

    const quizAttempts = await ModuleQuizSubmission.countDocuments({
        user: userId,
        module: { $in: (await Module.find({ course: courseId }).distinct('_id')) },
    });
    const quizPassed = await ModuleQuizSubmission.countDocuments({
        user: userId,
        module: { $in: (await Module.find({ course: courseId }).distinct('_id')) },
        passed: true,
    });

    const totalCounted = daily.reviewed + quizAttempts;
    const totalSuccess = daily.successful + quizPassed;
    const successPercent = totalCounted === 0 ? 0 : Math.round((totalSuccess / totalCounted) * 100);

    return {
        successPercent,
        totalCounted,
        totalSuccess,
        daily,
        quizAttempts,
        quizPassed,
    };
}

export const evaluateCourseCertification = async (userId, courseId) => {
    const course = await Course.findById(courseId).select('title isPublished');
    if (!course) throw new Error('Course not found.');

    const rule = await getOrCreateCourseRule(courseId);
    const modules = await Module.find({ course: courseId }).select('_id');
    const moduleIds = modules.map((m) => m._id);
    const totalModules = moduleIds.length;
    const completedModules =
        totalModules > 0
            ? await ModuleCompletion.countDocuments({
                  user: userId,
                  course: courseId,
                  isCompleted: true,
                  module: { $in: moduleIds },
              })
            : 0;

    const completionPercent = totalModules === 0 ? 0 : Math.round((completedModules / totalModules) * 100);
    const meetsCompletion = completionPercent >= rule.minimumCompletionPercent;

    const passedSubmission = await FinalAssessmentAttempt.findOne({
        user: userId,
        course: courseId,
        status: 'SUBMITTED',
        passed: true,
    }).sort({ score: -1, submittedAt: -1 });

    const meetsAssessment =
        !rule.requireAssessment || (passedSubmission && passedSubmission.score >= rule.passingScore);

    const quizStats = await collectModuleQuizStats(userId, courseId);
    const meetsModuleQuizzes =
        !rule.requireModuleQuizzes ||
        (quizStats.modulesWithQuiz === 0
            ? true
            : quizStats.allRequiredPassed && quizStats.averageBestScore >= (rule.minimumModuleQuizScore ?? 70));

    const lookback = rule.dailySubmissionLookbackDays ?? 90;
    const dailyStats = await collectDailySubmissionStats(userId, lookback);
    const meetsDaily =
        !rule.requireDailySubmissions ||
        (dailyStats.reviewed > 0 && dailyStats.successPercent >= (rule.minimumDailySubmissionPercent ?? 70));

    const overallStats = await collectOverallSubmissionStats(userId, courseId, lookback);
    const minOverall = rule.minimumOverallSubmissionPercent ?? 0;
    const meetsOverall =
        minOverall <= 0 ||
        (overallStats.totalCounted > 0 && overallStats.successPercent >= minOverall);

    const pillars = {
        modules: {
            percent: completionPercent,
            completedModules,
            totalModules,
            met: meetsCompletion,
        },
        moduleQuizzes: {
            averageBestScore: quizStats.averageBestScore,
            allRequiredPassed: quizStats.allRequiredPassed,
            perModule: quizStats.perModule,
            met: meetsModuleQuizzes,
        },
        dailySubmissions: {
            reviewedCount: dailyStats.reviewed,
            successPercent: dailyStats.successPercent,
            met: meetsDaily,
        },
        overallSubmissions: {
            successPercent: overallStats.successPercent,
            totalCounted: overallStats.totalCounted,
            met: meetsOverall,
        },
        assessment: {
            score: passedSubmission?.score ?? null,
            met: meetsAssessment,
        },
    };

    const reasons = [];
    if (!rule.isEnabled) reasons.push('Certification is disabled for this course.');
    if (rule.readOnlyMode) reasons.push('Course certificate is in read-only mode.');
    if (!meetsCompletion) {
        reasons.push(`Complete at least ${rule.minimumCompletionPercent}% of modules (videos + quizzes).`);
    }
    if (!meetsModuleQuizzes && rule.requireModuleQuizzes) {
        reasons.push(
            `Pass all module quizzes with an average score of at least ${rule.minimumModuleQuizScore ?? 70}%. Review videos and re-attempt quizzes.`
        );
    }
    if (!meetsDaily && rule.requireDailySubmissions) {
        reasons.push(
            `Improve daily practice submissions (${rule.minimumDailySubmissionPercent ?? 70}% success required in the last ${lookback} days).`
        );
    }
    if (!meetsOverall && minOverall > 0) {
        reasons.push(
            `Overall submission success rate must be at least ${minOverall}%. Keep practicing daily activities and module quizzes.`
        );
    }
    if (!meetsAssessment && rule.requireAssessment) {
        reasons.push(`Pass the final assessment with ${rule.passingScore}% or higher.`);
    }

    const passed =
        rule.isEnabled &&
        !rule.readOnlyMode &&
        meetsCompletion &&
        meetsModuleQuizzes &&
        meetsDaily &&
        meetsOverall &&
        meetsAssessment;

    const reportCard = passed
        ? {
              courseId,
              generatedAt: new Date().toISOString(),
              completionPercent,
              pillars,
              moduleQuizBreakdown: quizStats.perModule,
              dailySubmissions: dailyStats,
              overallSubmissions: overallStats,
              assessmentScore: passedSubmission?.score ?? null,
          }
        : null;

    return {
        passed,
        isEligible: passed,
        pillars,
        reasons,
        reportCard,
        rule,
        course,
        totalModules,
        completedModules,
        completionPercent,
        assessmentScore: passedSubmission?.score ?? null,
        assessmentAttempt: passedSubmission,
    };
};
