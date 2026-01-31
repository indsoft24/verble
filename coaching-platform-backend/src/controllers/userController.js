// src/controllers/userController.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import Video from "../models/Video.js";
import Course from "../models/Course.js";
import mongoose from "mongoose";
import sendEmail from '../utils/email.js';
import { checkAndHandleSubscriptionExpiration } from '../services/subscriptionAccessService.js';

/**
 * @desc    Get current user's profile details
 * @route   GET /api/users/me
 * @access  Private
 */
export const getMyUserProfile = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({
          status: "fail",
          message: "Not authorized, user not found in request.",
        });
    }
    const user = await User.findById(req.user._id)
      .select("-password -activeSessions")
      .populate({
        path: "subscriptions.planId",
        model: "SubscriptionPlan",
        select: "name price currency duration isActive features",
      });
    if (!user) {
      return res
        .status(404)
        .json({ status: "fail", message: "User not found." });
    }

    // Check and update subscription expiration and unlocked levels
    try {
      await checkAndHandleSubscriptionExpiration(req.user._id);
      // Refresh user to get updated unlocked levels
      const updatedUser = await User.findById(req.user._id)
        .select("-password -activeSessions")
        .populate({
          path: "subscriptions.planId",
          model: "SubscriptionPlan",
          select: "name price currency duration isActive features",
        });
      
      res.status(200).json({
        status: "success",
        data: {
          user: updatedUser,
        },
      });
    } catch (error) {
      console.error("Error checking subscription expiration:", error);
      // Still return user data even if subscription check fails
      res.status(200).json({
        status: "success",
        data: {
          user: user,
        },
      });
    }
  } catch (error) {
    console.error("GET MY USER PROFILE ERROR:", error);
    res
      .status(500)
      .json({
        status: "error",
        message: "Server error while fetching user profile.",
      });
  }
};

export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (user) {
      res.status(200).json({
        status: "success",
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phoneNumber: user.phoneNumber,
          },
        },
      });
    } 
  } catch (error) {
    res.status(404);
    throw new Error("User not found");
  }
};

// @desc    Update current logged-in user's profile (name, phoneNumber)
// @route   PATCH /api/users/me/update-profile
// @access  Private
export const updateMyProfileDetails = async (req, res, next) => {
  const { name, phoneNumber } = req.body;
  const userId = req.user._id;

  try {
    const fieldsToUpdate = {};
    if (name !== undefined) fieldsToUpdate.name = name;
    if (phoneNumber !== undefined) fieldsToUpdate.phoneNumber = phoneNumber;

    if (Object.keys(fieldsToUpdate).length === 0) {
      return res
        .status(400)
        .json({ status: "fail", message: "No fields provided for update." });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, fieldsToUpdate, {
      new: true,
      runValidators: true,
    }).select("-password -activeSessions");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ status: "fail", message: "User not found." });
    }

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully.",
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error("UPDATE MY PROFILE ERROR:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ status: "fail", message: messages.join(". ") });
    }
    res
      .status(500)
      .json({ status: "error", message: "Failed to update profile." });
  }
};

// @desc    Update current logged-in user's password
// @route   PATCH /api/users/me/update-password
// @access  Private
export const updateMyPasswordDetails = async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.user._id;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res
      .status(400)
      .json({
        status: "fail",
        message:
          "Please provide current password, new password, and confirm password.",
      });
  }

  if (newPassword !== confirmPassword) {
    return res
      .status(400)
      .json({
        status: "fail",
        message: "New password and confirm password do not match.",
      });
  }

  if (newPassword.length < 6) {
    // Or your password policy
    return res
      .status(400)
      .json({
        status: "fail",
        message: "New password must be at least 6 characters long.",
      });
  }

  try {
    const user = await User.findById(userId).select("+password");

    if (!user || !(await user.comparePassword(currentPassword))) {
      return res
        .status(401)
        .json({ status: "fail", message: "Incorrect current password." });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("UPDATE MY PASSWORD ERROR:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to update password." });
  }
};

/**
 * @desc    Get courses accessible by the current logged-in user based on their subscriptions and video access.
 * @route   GET /api/users/me/accessible-courses
 * @access  Private
 */
export const getMyAccessibleCourses = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res
        .status(401)
        .json({ status: "fail", message: "User not authenticated." });
    }

    // 1. Get user's active subscription plan IDs
    const user = await User.findById(userId).select("subscriptions").lean();
    let userActivePlanIds = [];
    if (user && user.subscriptions && Array.isArray(user.subscriptions)) {
      const now = new Date();
      userActivePlanIds = user.subscriptions
        .filter(
          (sub) =>
            sub &&
            sub.planId &&
            sub.status === "active" &&
            sub.startDate &&
            new Date(sub.startDate) <= now &&
            sub.endDate &&
            new Date(sub.endDate) >= now
        )
        .map((sub) => sub.planId.toString());
    }

    const allPublishedVideos = await Video.find({ isPublished: true })
      .select("_id title courses requiredPlans")
      .lean();

    const accessibleVideoCourseIds = new Set();

    allPublishedVideos.forEach((video) => {
      let canAccessVideo = false;
      if (!video.requiredPlans || video.requiredPlans.length === 0) {
        canAccessVideo = true;
      } else if (userActivePlanIds.length > 0) {
        canAccessVideo = video.requiredPlans.some((reqPlanId) =>
          userActivePlanIds.includes(reqPlanId.toString())
        );
      }

      if (canAccessVideo && video.courses && video.courses.length > 0) {
        video.courses.forEach((courseId) => {
          if (courseId) {
            accessibleVideoCourseIds.add(courseId.toString());
          }
        });
      }
    });

    const uniqueAccessibleCourseIds = Array.from(accessibleVideoCourseIds);

    if (uniqueAccessibleCourseIds.length === 0) {
      return res.status(200).json({
        status: "success",
        results: 0,
        data: { courses: [] },
      });
    }

    const accessibleCourses = await Course.find({
      _id: {
        $in: uniqueAccessibleCourseIds.map(
          (id) => new mongoose.Types.ObjectId(id)
        ),
      },
      isPublished: true,
    })
      .select("title description createdAt updatedAt isPublished")
      .sort({ title: 1 });

    res.status(200).json({
      status: "success",
      results: accessibleCourses.length,
      data: {
        courses: accessibleCourses,
      },
    });
  } catch (error) {
    console.error("GET MY ACCESSIBLE COURSES ERROR:", error.stack);
    res
      .status(500)
      .json({
        status: "error",
        message: "Failed to fetch accessible courses.",
      });
  }
};


/**
 * @desc    Handles a user's request to delete their account from a web form.
 * @route   POST /api/users/request-account-deletion
 * @access  Public
 */
export const requestAccountDeletion = async (req, res) => {
    const { email, appName } = req.body;

    if (!email) {
        return res.status(400).json({ status: 'fail', message: 'Email address is required.' });
    }

    try {
        await sendEmail({
            email: 'marseducationpvtltd@gmail.com', // Your admin email
            subject: `[Action Required] Account Deletion Request for ${appName || 'App'}`,
            html: `
                <p>A user has requested to delete their account.</p>
                <p><strong>User Email:</strong> ${email}</p>
                <p><strong>App:</strong> ${appName || 'Not specified'}</p>
                <p>Please process this deletion request manually from the database.</p>
            `
        });

        res.status(200).json({
            status: 'success',
            message: 'Your account deletion request has been received. If a matching account is found, it will be processed.'
        });

    } catch (error) {
        console.error("ACCOUNT DELETION REQUEST ERROR:", error);
        res.status(500).json({ status: 'error', message: 'Failed to process your request at this time.' });
    }
};
