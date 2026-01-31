import Lead from '../models/Lead.js';
import BlogPost from '../models/BlogPost.js';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import axios from 'axios';
import asyncHandler from 'express-async-handler';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 587,
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * @desc    Handles a general lead submission from the chatbot
 * @route   POST /api/leads/general
 * @access  Public
 */
export const submitGeneralLead = asyncHandler(async (req, res) => {
    const { name, email, phoneNumber, interestedCourses, otherCourseInterest, sourceUrl } = req.body;

    if (!name || !email || !phoneNumber) {
        res.status(400);
        throw new Error('Name, email, and phone number are required.');
    }

    // Save the lead to the database
    await Lead.create({
        name, email, phoneNumber, interestedCourses, otherCourseInterest, sourceUrl,
    });

    // Send email notification to admin
    const emailBody = `
        <h1>New Chatbot Lead</h1>
        <p>A new lead has been captured from the chatbot widget.</p>
        <ul>
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Phone:</strong> ${phoneNumber}</li>
            <li><strong>Interested Courses:</strong> ${interestedCourses.join(', ') || 'None specified'}</li>
            ${otherCourseInterest ? `<li><strong>Other:</strong> ${otherCourseInterest}</li>` : ''}
            <li><strong>Source Page:</strong> <a href="${sourceUrl}">${sourceUrl}</a></li>
        </ul>
    `;
    
    await transporter.sendMail({
        from: `"Verble Leads" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL || 'admin@verble.app',
        subject: `New Chatbot Lead: ${name}`,
        html: emailBody,
    });

    res.status(201).json({
        status: 'success',
        message: 'Thank you for your details! Our team will be in touch.',
    });
});

/**
 * @desc    Handles submission of the lead capture form
 * @route   POST /api/leads/submit
 * @access  Public
 */
export const submitLeadAndGetToken = asyncHandler(async (req, res) => {
    const { name, email, phoneNumber, interestedCourses, otherCourseInterest, sourceUrl, postId, attachmentId } = req.body;

    if (!name || !email || !phoneNumber || !sourceUrl || !postId || !attachmentId) {
        res.status(400);
        throw new Error('Missing required form data for file download.');
    }

    const newLead = await Lead.create({
        name, email, phoneNumber, interestedCourses, otherCourseInterest, sourceUrl,
    });

    const post = await BlogPost.findById(postId).select('gatedAttachments');
    const attachment = post?.gatedAttachments.id(attachmentId);

    if (!attachment) {
        res.status(404);
        throw new Error('The requested file could not be found.');
    }

    const emailBody = `
        <h1>New File Download Lead</h1>
        <p>A new lead has been captured from a blog post.</p>
        <ul>
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Phone:</strong> ${phoneNumber}</li>
            <li><strong>Interested Courses:</strong> ${interestedCourses.join(', ')}</li>
            ${otherCourseInterest ? `<li><strong>Other:</strong> ${otherCourseInterest}</li>` : ''}
            <li><strong>Downloaded File:</strong> ${attachment.label} (${attachment.originalFileName})</li>
            <li><strong>Source Page:</strong> <a href="${sourceUrl}">${sourceUrl}</a></li>
        </ul>
    `;
    
    await transporter.sendMail({
        from: `"Verble Leads" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL || 'admin@verble.app', 
        subject: `New Lead from Blog: ${name}`,
        html: emailBody,
    });

    const downloadToken = jwt.sign(
        { 
            storagePath: attachment.storagePath,
            originalFileName: attachment.originalFileName,
            fileType: attachment.fileType
        },
        process.env.JWT_SECRET,
        { expiresIn: '10m' } 
    );

    res.status(200).json({
        status: 'success',
        message: 'Lead captured. Your download will begin shortly.',
        token: downloadToken,
    });
});

/**
 * @desc    Securely downloads a file using a one-time token
 * @route   GET /api/downloads/:token
 * @access  Public
 */
export const downloadGatedFile = asyncHandler(async (req, res) => {
    const { token } = req.params;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const { storagePath, originalFileName, fileType } = decoded;

        const downloadUrl = `https://${process.env.BUNNY_STORAGE_HOSTNAME}/${process.env.BUNNY_STORAGE_ZONE_NAME}/${storagePath}`;
        
        const response = await axios({
            method: 'get',
            url: downloadUrl,
            responseType: 'stream',
            headers: { 'AccessKey': process.env.BUNNY_STORAGE_ACCESS_KEY },
        });

        res.setHeader('Content-Disposition', `attachment; filename="${originalFileName}"`);
        res.setHeader('Content-Type', fileType || 'application/octet-stream');
        
        response.data.pipe(res);

    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(403);
            throw new Error('Download link has expired. Please fill out the form again.');
        }
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(403);
            throw new Error('Invalid download link.');
        }
        res.status(500);
        throw new Error('Could not download the file.');
    }
});