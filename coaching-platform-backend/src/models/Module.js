// src/models/Module.js
import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A module must have a title."],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    timeline: {
      type: String,
      trim: true,
    },
    chapters: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      trim: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    subscriptionPlans: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
    }],
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
moduleSchema.index({ course: 1, order: 1 });
moduleSchema.index({ subscriptionPlans: 1 });
moduleSchema.index({ course: 1, order: 1, createdAt: 1 }); // Compound index for course modules

const Module = mongoose.model("Module", moduleSchema);
export default Module;
