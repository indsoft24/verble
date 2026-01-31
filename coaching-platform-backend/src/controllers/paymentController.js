import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import User from '../models/User.js';
import { validateWebhookSignature } from 'razorpay/dist/utils/razorpay-utils.js';
import { getRazorpayConfig } from '../config/razorpayConfig.js';

// Helper function to calculate subscription end dates.
const calculateEndDate = (startDate, duration) => {
    const date = new Date(startDate);
    if (!duration || !duration.unit || typeof duration.value !== 'number') {
        date.setFullYear(date.getFullYear() + 100); // Default to a long duration if data is invalid
        return date;
    }
    switch (duration.unit) {
        case 'day': date.setDate(date.getDate() + duration.value); break;
        case 'week': date.setDate(date.getDate() + duration.value * 7); break;
        case 'month': date.setMonth(date.getMonth() + duration.value); break;
        case 'year': date.setFullYear(date.getFullYear() + duration.value); break;
        default: throw new Error('Invalid duration unit');
    }
    return date;
};

export const createRazorpayOrder = async (req, res) => {
    try {
        const { planId } = req.body;
        if (!mongoose.Types.ObjectId.isValid(planId)) {
            return res.status(400).json({ message: 'Invalid Plan ID' });
        }
        const plan = await SubscriptionPlan.findById(planId);
        if (!plan) {
            return res.status(404).json({ message: 'Subscription plan not found' });
        }

        // Get Razorpay configuration
        const razorpayConfig = getRazorpayConfig();
        
        const instance = new Razorpay({
            key_id: razorpayConfig.key_id,
            key_secret: razorpayConfig.key_secret,
        });
        
        const options = {
            amount: plan.price,
            currency: plan.currency,
            receipt: `receipt_order_${new Date().getTime()}`,
            payment_capture: 1,
            notes: {
                planId: planId,
                userId: req.user._id.toString()
            }
        };
        const order = await instance.orders.create(options);
        res.status(200).json({ status: 'success', data: { order } });
    } catch (error) {
        console.error("CREATE RAZORPAY ORDER ERROR:", error);
        res.status(500).json({ 
            status: 'error',
            message: 'Failed to create payment order. Please try again.' 
        });
    }
};

/**
 * @desc      Verify Razorpay Payment and Create Subscription
 * @route     POST /api/payments/verify-payment
 * @access    Private
 */
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
        const userId = req.user._id;

        // Get Razorpay configuration for signature verification
        const razorpayConfig = getRazorpayConfig();

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', razorpayConfig.key_secret)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ status: 'fail', message: 'Invalid payment signature.' });
        }

        const plan = await SubscriptionPlan.findById(planId);
        const user = await User.findById(userId);
        if (!plan || !user) {
            return res.status(404).json({ status: 'fail', message: 'Plan or User not found.' });
        }
        
        const alreadySubscribed = user.subscriptions.some(sub => 
          sub.paymentDetails && sub.paymentDetails.razorpay_payment_id === razorpay_payment_id
        );

        if (alreadySubscribed) {
          return res.status(200).json({ status: 'success', message: 'Subscription already activated.'});
        }

        const startDate = new Date();
        const endDate = calculateEndDate(startDate, plan.duration);

        const newSubscriptionInstance = {
            planId: plan._id,
            planName: plan.name,
            status: 'active',
            startDate,
            endDate,
            paymentDetails: {
                gateway: 'razorpay',
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
            },
        };

        user.subscriptions.push(newSubscriptionInstance);
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            status: 'success',
            message: `Payment successful! You are now subscribed to ${plan.name}.`,
        });

    } catch (error) {
        console.error("VERIFY PAYMENT ERROR:", error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};


/**
 * @desc      Handle Razorpay Webhook notifications
 * @route     POST /api/payments/razorpay-webhook
 * @access    Public (Secured by webhook secret)
 */
export const razorpayWebhook = async (req, res) => {
    const webhookBody = req.body;
    const webhookSignature = req.headers['x-razorpay-signature'];

    console.log("--- RAZORPAY WEBHOOK RECEIVED ---");

    try {
        // Get Razorpay configuration
        const razorpayConfig = getRazorpayConfig();
        const webhookSecret = razorpayConfig.webhook_secret;

        if (!webhookSecret) {
            console.error('Webhook secret not configured');
            return res.status(400).json({ status: 'error', message: 'Webhook secret not configured' });
        }

        const isSignatureValid = validateWebhookSignature(
            JSON.stringify(webhookBody),
            webhookSignature,
            webhookSecret
        );

        if (!isSignatureValid) {
            console.error('Webhook signature validation FAILED. The signatures do not match. Please ensure your RAZORPAY_WEBHOOK_SECRET is correct in both your .env file and the Razorpay Dashboard.');
            return res.status(400).json({ status: 'error', message: 'Invalid signature' });
        }
        
        console.log('Webhook signature validation SUCCESSFUL.');
        const event = webhookBody; 
        
        if (event.event === 'payment.captured' || event.event === 'order.paid') {
            const paymentEntity = event.payload.payment.entity;
            const { planId, userId } = paymentEntity.notes;

            if (!planId || !userId) {
                console.error('Webhook Error: Missing planId or userId in payment notes.');
                return res.status(400).send('Missing required notes in payment entity.');
            }
            
            const user = await User.findById(userId);
            const plan = await SubscriptionPlan.findById(planId);
            
            if (user && plan) {
                const alreadySubscribed = user.subscriptions.some(sub => 
                    sub.paymentDetails && sub.paymentDetails.razorpay_payment_id === paymentEntity.id
                );
                
                if (!alreadySubscribed) {
                    const startDate = new Date();
                    const endDate = calculateEndDate(startDate, plan.duration);
                    user.subscriptions.push({
                        planId: plan._id,
                        planName: plan.name,
                        status: 'active',
                        startDate,
                        endDate,
                        paymentDetails: {
                            gateway: 'razorpay',
                            razorpay_order_id: paymentEntity.order_id,
                            razorpay_payment_id: paymentEntity.id,
                            razorpay_signature: 'verified_by_webhook'
                        }
                    });
                    await user.save({ validateBeforeSave: false });
                    console.log(`Webhook: Successfully activated subscription for user ${userId}.`);
                }
            }
        }

        res.status(200).json({ status: 'ok' });

    } catch (error) {
        console.error("RAZORPAY WEBHOOK ERROR:", error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};


