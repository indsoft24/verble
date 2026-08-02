import mongoose from 'mongoose';

const finalAssessmentQuestionSchema = new mongoose.Schema(
    {
        course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
        externalId: { type: String, trim: true },
        prompt: { type: String, required: true, trim: true, maxlength: 5000 },
        options: {
            type: [{ type: String, trim: true, maxlength: 2000 }],
            required: true,
            validate: {
                validator: (options) =>
                    Array.isArray(options) &&
                    options.length >= 2 &&
                    options.length <= 10 &&
                    options.every((option) => option.length > 0),
                message: 'Questions require 2-10 non-empty options.',
            },
        },
        correctOption: { type: Number, required: true, min: 0 },
        explanation: { type: String, trim: true, maxlength: 5000 },
        points: { type: Number, default: 1, min: 0.01, max: 100 },
        active: { type: Boolean, default: true, index: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

finalAssessmentQuestionSchema.path('correctOption').validate(function (value) {
    return Array.isArray(this.options) && value < this.options.length;
}, 'correctOption is outside the options array.');
finalAssessmentQuestionSchema.index(
    { course: 1, externalId: 1 },
    { unique: true, partialFilterExpression: { externalId: { $type: 'string' } } }
);

export default mongoose.model('FinalAssessmentQuestion', finalAssessmentQuestionSchema);
