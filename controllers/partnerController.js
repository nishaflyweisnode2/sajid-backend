const User = require('../models/userModel');
const authConfig = require("../configs/auth.config");
const jwt = require("jsonwebtoken");
const newOTP = require("otp-generators");
const bcrypt = require("bcryptjs");
const City = require('../models/cityModel');
const Bike = require('../models/bikeModel');
const Location = require("../models/bikeLocationModel");
const Booking = require('../models/bookingModel');
const Store = require('../models/storeModel');
const BikeStoreRelation = require('../models/BikeStoreRelationModel');
const Coupon = require('../models/couponModel');
const AccessoryCategory = require('../models/accessory/accessoryCategoryModel')
const Accessory = require('../models/accessory/accessoryModel')
const Order = require('../models/orderModel')
const mongoose = require('mongoose');
const Notification = require('../models/notificationModel');
const { update } = require('./adminController');
const PDFDocument = require("pdfkit-table");
const doc = new PDFDocument({ autoFirstPage: true, margin: 10, size: 'A4' });
const nodemailer = require('nodemailer')
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const fs = require('fs');
const os = require('os');
const path = require('path');
const UserDetails = require('../models/userRefundModel');
const RefundCharge = require('../models/refundChargeModel');
const Refund = require('../models/refundModel');



// Configure Cloudinary with your credentials
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_SECRET,
});


exports.registration = async (req, res) => {
    const { mobileNumber, email } = req.body;
    try {
        req.body.email = email.split(" ").join("").toLowerCase();
        let user = await User.findOne({ $and: [{ $or: [{ email: req.body.email }, { mobileNumber: mobileNumber }] }], userType: "PARTNER" });
        if (!user) {
            req.body.password = bcrypt.hashSync(req.body.password, 8);
            req.body.userType = "PARTNER";
            req.body.accountVerification = true;
            const userCreate = await User.create(req.body);
            return res.status(200).send({ message: "registered successfully ", data: userCreate, });
        } else {
            return res.status(409).send({ message: "Already Exist", data: [] });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.signin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email, userType: "PARTNER" });
        if (!user) {
            return res
                .status(404)
                .send({ message: "user not found ! not registered" });
        }
        const isValidPassword = bcrypt.compareSync(password, user.password);
        if (!isValidPassword) {
            return res.status(401).send({ message: "Wrong password" });
        }
        const accessToken = jwt.sign({ id: user._id }, authConfig.secret, {
            expiresIn: authConfig.accessTokenTime,
        });
        let obj = {
            firstName: user.firstName,
            lastName: user.lastName,
            mobileNumber: user.mobileNumber,
            email: user.email,
            userType: user.userType,
        }
        const welcomeMessage = `Welcome, ${user.mobileNumber}! Thank you for Login.`;
        const welcomeNotification = new Notification({
            recipient: user._id,
            content: welcomeMessage,
            type: 'welcome',
        });
        await welcomeNotification.save();

        return res.status(201).send({ data: obj, accessToken: accessToken });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: "Server error" + error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { firstName, lastName, email, mobileNumber, password } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).send({ message: "not found" });
        }
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.email = email || user.email;
        user.mobileNumber = mobileNumber || user.mobileNumber;
        if (req.body.password) {
            user.password = bcrypt.hashSync(password, 8) || user.password;
        }
        const updated = await user.save();
        return res.status(200).send({ message: "updated", data: updated });
    } catch (err) {
        console.log(err);
        return res.status(500).send({
            message: "internal server error " + err.message,
        });
    }
};

exports.getStoresByPartnerId = async (req, res) => {
    try {
        const partnerId = req.user._id;

        const stores = await Store.find({ partner: partnerId }).populate('partner location');

        return res.status(200).json({
            status: 200,
            message: 'Stores retrieved successfully for the partner',
            data: stores,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getBikesByPartnerId = async (req, res) => {
    try {
        const partnerId = req.user._id;

        const stores = await Store.find({ partner: partnerId });

        const storeIds = stores.map(store => store._id);

        const relations = await BikeStoreRelation.find({ store: { $in: storeIds } });

        const bikeIds = relations.map(relation => relation.bike);

        const bikes = await Bike.find({ _id: { $in: bikeIds } }).populate('owner pickup drop');

        return res.status(200).json({
            status: 200,
            message: 'Bikes retrieved successfully for the partner',
            data: bikes,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getBikeByPartnerAndStore = async (req, res) => {
    try {
        const { partnerId, storeId } = req.params;

        const bikeRelations = await BikeStoreRelation.find({ partner: partnerId, store: storeId })
            .populate({
                path: 'bike',
                populate: { path: 'owner pickup drop' }
            });

        const bikes = bikeRelations.map(relation => relation.bike);

        return res.status(200).json({
            status: 200,
            message: 'Bikes retrieved successfully for the partner and store',
            data: bikes,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};


async function sendNotificationToPartner(booking, partnerId) {
    const partner = await User.findById(partnerId);

    if (partner && partner._id) {
        const notificationMessage = `You have a new booking scheduled for ${booking.pickupDate}.`;

        const notification = new Notification({
            recipient: partner._id,
            content: notificationMessage,
        });

        try {
            await notification.save();
        } catch (error) {
            console.error('Error saving partner notification:', error);
        }
    }
}

exports.getUpcomingBookingsForPartner = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const currentDate = new Date();

        const stores = await Store.find({ partner: partnerId });
        const storeIds = stores.map(store => store._id);

        const relations = await BikeStoreRelation.find({ store: { $in: storeIds } });
        const bikeIds = relations.map(relation => relation.bike);

        const bikes = await Bike.find({ _id: { $in: bikeIds } }).populate('owner pickup drop');

        const bikeObjectIds = bikes.map(bike => bike._id);

        const upcomingBookings = await Booking.find({
            bike: { $in: bikeObjectIds },
            paymentStatus: 'PAID',
            isTripCompleted: false,
            status: 'PENDING',
            $or: [
                {
                    $and: [
                        { pickupDate: { $gte: currentDate.toISOString().split('T')[0] } },
                        { pickupTime: { $gte: currentDate.toISOString().split('T')[1].split('.')[0] } }
                    ]
                },
                {
                    dropOffDate: { $gt: currentDate.toISOString().split('T')[0] }
                }
            ]
        }).populate('user bike');

        for (const booking of upcomingBookings) {
            await sendNotificationToPartner(booking, partnerId);
        }

        return res.status(200).json({
            status: 200,
            message: 'Upcoming bookings retrieved successfully for the partner',
            data: upcomingBookings,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getBookingByIdForPartner = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const bookingId = req.params.bookingId;

        const isPartnerAssociated = await Store.exists({ partner: partnerId });
        if (!isPartnerAssociated) {
            return res.status(403).json({ status: 403, message: 'Unauthorized. Partner is not associated with the store.', data: null });
        }

        const booking = await Booking.findById(bookingId).populate({
            path: 'bike',
            populate: { path: 'owner pickup drop' }
        }).populate('user');

        if (!booking) {
            return res.status(404).json({ status: 404, message: 'Booking not found', data: null });
        }

        return res.status(200).json({
            status: 200,
            message: 'Booking retrieved successfully for the partner',
            data: booking,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getCompletedBookingsForPartner = async (req, res) => {
    try {
        const partnerId = req.user._id;

        const stores = await Store.find({ partner: partnerId });
        const storeIds = stores.map(store => store._id);

        const relations = await BikeStoreRelation.find({ store: { $in: storeIds } });
        const bikeIds = relations.map(relation => relation.bike);

        const bikes = await Bike.find({ _id: { $in: bikeIds } }).populate('owner pickup drop');

        const bikeObjectIds = bikes.map(bike => bike._id);

        const completedBookings = await Booking.find({
            bike: { $in: bikeObjectIds },
            status: 'COMPLETED',
            paymentStatus: 'PAID',
            isTripCompleted: true,
        }).populate('user bike');

        return res.status(200).json({
            status: 200,
            message: 'Completed bookings retrieved successfully for the partner',
            data: completedBookings,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getCanceledBookingsForPartner = async (req, res) => {
    try {
        const partnerId = req.user._id;

        const stores = await Store.find({ partner: partnerId });

        const storeIds = stores.map(store => store._id);

        const relations = await BikeStoreRelation.find({ store: { $in: storeIds } });

        const bikeIds = relations.map(relation => relation.bike);

        const bikes = await Bike.find({ _id: { $in: bikeIds } }).populate('owner pickup drop');

        const bikeObjectIds = bikes.map(bike => bike._id);


        const canceledBookings = await Booking.find({
            bike: { $in: bikeObjectIds },
            status: 'CANCELLED',
            isTripCompleted: false,
        }).populate('user bike');

        return res.status(200).json({
            status: 200,
            message: 'Canceled bookings retrieved successfully for the partner',
            data: canceledBookings,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getPaymentFaliedBookingsForPartner = async (req, res) => {
    try {
        const partnerId = req.user._id;

        const stores = await Store.find({ partner: partnerId });

        const storeIds = stores.map(store => store._id);

        const relations = await BikeStoreRelation.find({ store: { $in: storeIds } });

        const bikeIds = relations.map(relation => relation.bike);

        const bikes = await Bike.find({ _id: { $in: bikeIds } }).populate('owner pickup drop');

        const bikeObjectIds = bikes.map(bike => bike._id);


        const canceledBookings = await Booking.find({
            bike: { $in: bikeObjectIds },
            status: 'PENDING',
            paymentStatus: 'FAILED',
            isTripCompleted: false,
        }).populate('user bike');

        return res.status(200).json({
            status: 200,
            message: 'Canceled bookings retrieved successfully for the partner',
            data: canceledBookings,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.approveBookingStatus = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const bookingId = req.params.bookingId;

        if (!bookingId) {
            return res.status(400).json({ status: 400, message: 'Booking ID is required', data: null });
        }

        const {
            tripStartKm,
            approvedImage,
            vechileNo,
        } = req.body;

        const booking = await Booking.findById(bookingId).populate('bike user');

        if (!booking) {
            return res.status(404).json({ status: 404, message: 'Booking not found', data: null });
        }

        const isPartnerAssociated = await Store.exists({ partner: partnerId });

        if (!isPartnerAssociated) {
            return res.status(403).json({ status: 403, message: 'Unauthorized. Partner is not associated with the store.', data: null });
        }

        if (booking.paymentStatus !== "PAID") {
            return res.status(403).json({ status: 403, message: 'Cannot approve booking because payment is not complete', data: null });
        }

        if (!req.file) {
            return res.status(400).json({ status: 400, error: "Image file is required" });
        }

        if (tripStartKm) {
            booking.tripStartKm = req.body.tripStartKm;
        }

        if (vechileNo) {
            booking.vechileNo = req.body.vechileNo;
        }

        let otp = newOTP.generate(6, { alphabets: false, upperCase: false, specialChar: false });

        booking.tripStartKm = req.body.tripStartKm || tripStartKm;
        booking.approvedOtp = otp;
        booking.approvedImage = approvedImage || req.file.path;
        booking.vechileNo = req.body.vechileNo || vechileNo;

        booking.status = 'APPROVED';

        await booking.save();

        const welcomeMessage = `Welcome, ${booking.user.mobileNumber}! Thank you for Booking your Booking is Approved.`;
        const welcomeNotification = new Notification({
            recipient: booking.user._id,
            content: welcomeMessage,
            type: 'welcome',
        });
        await welcomeNotification.save();

        // const store = await Store.findOne({ partner: partnerId });

        // if (!store) {
        //     return res.status(404).json({ status: 404, message: 'Store not found for the partner', data: null });
        // }

        // const bikeStoreRelation = await BikeStoreRelation.findOneAndUpdate(
        //     { bike: booking.bike, store: store._id },
        //     { $inc: { totalNumberOfBookedBikes: 1 } },
        //     { new: true }
        // );

        // if (!bikeStoreRelation) {
        //     return res.status(404).json({ status: 404, message: 'BikeStoreRelation not found', data: null });
        // }

        return res.status(200).json({
            status: 200,
            message: 'Booking status approved successfully',
            data: booking,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.approveBookingVerifyOtp = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const bookingId = req.params.bookingId;
        const { otp } = req.body;

        const isPartnerAssociated = await Store.exists({ partner: partnerId });

        if (!isPartnerAssociated) {
            return res.status(403).json({ status: 403, message: 'Unauthorized. Partner is not associated with the store.', data: null });
        }

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ status: 404, message: 'Booking not found', data: null });
        }

        const userId = booking.user;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        if (booking.approvedOtp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId,
            {
                isApprovedOtp: true,
                tripStartTime: new Date
            },
            { new: true }
        );

        if (updatedBooking) {
            await Bike.findByIdAndUpdate(
                updatedBooking.bike,
                { isOnTrip: true },
                { new: true }
            );
        }

        return res.status(200).send({ status: 200, message: "OTP verified successfully", data: updatedBooking });
    } catch (err) {
        console.error(err.message);
        return res.status(500).send({ error: "Internal server error" + err.message });
    }
};

exports.approveBookingResendOTP = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const { id } = req.params;

        const isPartnerAssociated = await Store.exists({ partner: partnerId });

        if (!isPartnerAssociated) {
            return res.status(403).json({ status: 403, message: 'Unauthorized. Partner is not associated with the store.', data: null });
        }

        const otp = newOTP.generate(6, { alphabets: false, upperCase: false, specialChar: false });

        const updated = await Booking.findOneAndUpdate(
            { _id: id },
            { approvedOtp: otp, isApprovedOtp: false },
            { new: true }
        );

        return res.status(200).send({ status: 200, message: "OTP resent", data: updated });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: 500, message: "Server error" + error.message });
    }
};

exports.getApprovedBookingsForPartner1 = async (req, res) => {
    try {
        const partnerId = req.user._id;

        const stores = await Store.find({ partner: partnerId });

        const storeIds = stores.map(store => store._id);

        const relations = await BikeStoreRelation.find({ store: { $in: storeIds } });

        const bikeId = relations.map(relation => relation.bike);

        const accessories = await Bike.find({ _id: { $in: bikeId } })

        const booking = await Booking.findById(bikeId).populate('bike');

        if (!booking) {
            return res.status(404).json({ status: 404, message: 'Booking not found', data: null });
        }

        const isPartnerAssociated = await Store.exists({ partner: partnerId, });

        if (!isPartnerAssociated) {
            return res.status(403).json({ status: 403, message: 'Unauthorized. Partner is not associated with the store.', data: null });
        }

        if (booking.paymentStatus !== "PAID") {
            return res.status(403).json({ status: 403, message: 'Cannot approve booking because payment is not complete', data: null });
        }

        const approvedBookings = await Booking.find({
            status: 'APPROVED',
        }).populate({
            path: 'bike',
            // populate: {
            //     path: 'store',
            // },
        });

        return res.status(200).json({
            status: 200,
            message: 'Approved bookings for partner retrieved successfully',
            data: approvedBookings,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getApprovedBookingsForPartner = async (req, res) => {
    try {
        const partnerId = req.user._id;

        const isPartnerAssociated = await Store.exists({ partner: partnerId });
        if (!isPartnerAssociated) {
            return res.status(403).json({ status: 403, message: 'Unauthorized. Partner is not associated with any store.', data: null });
        }

        const storeIds = (await Store.find({ partner: partnerId })).map(store => store._id);

        const relations = await BikeStoreRelation.find({ store: { $in: storeIds } });

        const bikeIds = relations.map(relation => relation.bike);

        const approvedBookings = await Booking.find({
            bike: { $in: bikeIds },
            status: 'APPROVED',
            paymentStatus: 'PAID'
        }).populate('bike');

        return res.status(200).json({
            status: 200,
            message: 'Approved bookings for partner retrieved successfully',
            data: approvedBookings,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.rejectBookingStatus = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const bookingId = req.params.bookingId;

        const {
            rejectRemarks,
        } = req.body;

        if (!bookingId) {
            return res.status(400).json({ status: 400, message: 'Booking ID is required', data: null });
        }

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(400).json({ status: 400, message: 'Booking is not found', data: null });
        }

        const isPartnerAssociated = await Store.exists({ partner: partnerId });

        if (!isPartnerAssociated) {
            return res.status(403).json({ status: 403, message: 'Unauthorized. Partner is not associated with the store.', data: null });
        }

        if (booking.paymentStatus !== "PAID") {
            return res.status(403).json({ status: 403, message: 'Cannot canclelled booking because payment is not complete', data: null });
        }

        let otp = newOTP.generate(6, { alphabets: false, upperCase: false, specialChar: false });


        booking.status = 'CANCELLED';
        booking.rejectRemarks = req.body.rejectRemarks || rejectRemarks;
        booking.rejectOtp = otp

        await booking.save();

        const welcomeMessage = `Welcome, ${booking.user.mobileNumber}! Thank you for Booking your Booking is Rject.`;
        const welcomeNotification = new Notification({
            recipient: booking.user._id,
            content: welcomeMessage + " " + rejectRemarks,
            type: 'welcome',
        });
        await welcomeNotification.save();

        return res.status(200).json({
            status: 200,
            message: 'Booking status CANCELLED successfully',
            data: booking,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.rejectBookingVerifyOtp = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const bookingId = req.params.bookingId;
        const { otp } = req.body;

        const isPartnerAssociated = await Store.exists({ partner: partnerId });

        if (!isPartnerAssociated) {
            return res.status(403).json({ status: 403, message: 'Unauthorized. Partner is not associated with the store.', data: null });
        }

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ status: 404, message: 'Booking not found', data: null });
        }

        const userId = booking.user;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        if (booking.rejectOtp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        const updated = await Booking.findByIdAndUpdate(
            bookingId,
            { isRejectOtp: true },
            { new: true }
        );

        return res.status(200).send({ status: 200, message: "OTP verified successfully", data: updated });
    } catch (err) {
        console.error(err.message);
        return res.status(500).send({ error: "Internal server error" + err.message });
    }
};

exports.rejectBookingResendOTP = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const { id } = req.params;

        const isPartnerAssociated = await Store.exists({ partner: partnerId });

        if (!isPartnerAssociated) {
            return res.status(403).json({ status: 403, message: 'Unauthorized. Partner is not associated with the store.', data: null });
        }

        const otp = newOTP.generate(6, { alphabets: false, upperCase: false, specialChar: false });

        const updated = await Booking.findOneAndUpdate(
            { _id: id },
            { rejectOtp: otp, isRejectOtp: false },
            { new: true }
        );

        return res.status(200).send({ status: 200, message: "OTP resent", data: updated });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: 500, message: "Server error" + error.message });
    }
};

exports.getRejectedBookingsForPartner = async (req, res) => {
    try {
        const partnerId = req.user._id;

        const isPartnerAssociated = await Store.exists({ partner: partnerId });
        if (!isPartnerAssociated) {
            return res.status(403).json({ status: 403, message: 'Unauthorized. Partner is not associated with any store.', data: null });
        }

        const storeIds = (await Store.find({ partner: partnerId })).map(store => store._id);

        const relations = await BikeStoreRelation.find({ store: { $in: storeIds } });

        const bikeIds = relations.map(relation => relation.bike);

        const rejectBookings = await Booking.find({
            bike: { $in: bikeIds },
            status: 'CANCELLED',
        }).populate('bike');

        return res.status(200).json({
            status: 200,
            message: 'Reject bookings for partner retrieved successfully',
            data: rejectBookings,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getAccessoryByPartnerId = async (req, res) => {
    try {
        const partnerId = req.user._id;

        const stores = await Store.find({ partner: partnerId });

        const storeIds = stores.map(store => store._id);

        const relations = await BikeStoreRelation.find({ store: { $in: storeIds } });

        const accessoryIds = relations.map(relation => relation.accessory);

        const accessories = await Accessory.find({ _id: { $in: accessoryIds } })
            .populate('category')
            .exec();

        return res.status(200).json({
            status: 200,
            message: 'Accessories retrieved successfully for the partner',
            data: accessories,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getAccessoryByPartnerAndStore = async (req, res) => {
    try {
        const partnerId = req.user._id;

        const stores = await Store.find({ partner: partnerId });

        const storeIds = stores.map(store => store._id);

        const relations = await BikeStoreRelation.find({ store: { $in: storeIds } });

        const accessoryIds = relations.map(relation => relation.accessory);

        const accessories = await Accessory.find({ _id: { $in: accessoryIds } })
            .populate('category')
            .exec();

        return res.status(200).json({
            status: 200,
            message: 'Accessories retrieved successfully for the partner and store',
            data: accessories,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.updateTripEndDetails = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const bookingId = req.params.bookingId;
        const { tripEndKm, remarks } = req.query;

        const isPartnerAssociated = await Store.exists({ partner: partnerId });

        if (!isPartnerAssociated) {
            return res.status(403).json({ status: 403, message: 'Unauthorized. Partner is not associated with the store.', data: null });
        }

        if (!bookingId) {
            return res.status(400).json({ status: 400, message: 'Booking ID is required', data: null });
        }

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ status: 404, message: 'Booking not found', data: null });
        }

        if (booking.isTripCompleted) {
            return res.status(400).json({ status: 400, message: 'Trip is already marked as completed', data: null });
        }

        booking.tripEndKm = req.query.tripEndKm !== undefined ? req.query.tripEndKm : booking.tripEndKm;

        booking.remarks = req.query.remarks !== undefined ? req.query.remarks : booking.remarks;

        const bike = await Bike.findById(booking.bike);
        if (bike) {
            bike.totalKm += booking.tripEndKm;
            await bike.save();
        }

        let otp = newOTP.generate(6, { alphabets: false, upperCase: false, specialChar: false });

        booking.tripEndTime = new Date();
        booking.tripEndOtp = otp;

        const updatedBooking = await booking.save();

        const store = await Store.findOne({ partner: partnerId });

        if (!store) {
            return res.status(404).json({ status: 404, message: 'Store not found for the partner', data: null });
        }

        const bikeStoreRelation = await BikeStoreRelation.findOneAndUpdate(
            { bike: booking.bike, store: store._id },
            { $inc: { totalNumberOfBookedBikes: -1 } },
            { new: true }
        );

        if (!bikeStoreRelation) {
            return res.status(404).json({ status: 404, message: 'BikeStoreRelation not found', data: null });
        }

        if (updatedBooking) {
            await Bike.findByIdAndUpdate(
                updatedBooking.bike,
                { isOnTrip: false },
                { new: true }
            );
        }

        return res.status(200).json({ status: 200, message: 'Trip end details updated successfully', data: updatedBooking });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.approveTripEndDetailsVerifyOtp = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const bookingId = req.params.bookingId;
        const { otp } = req.body;

        const isPartnerAssociated = await Store.exists({ partner: partnerId });

        if (!isPartnerAssociated) {
            return res.status(403).json({ status: 403, message: 'Unauthorized. Partner is not associated with the store.', data: null });
        }

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ status: 404, message: 'Booking not found', data: null });
        }

        const userId = booking.user;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        if (booking.tripEndOtp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId,
            {
                isTripEndOtp: true,
                isTripCompleted: true,
                status: "COMPLETED",
            },
            { new: true }
        );
        console.log(userId);
        const userDetails = await UserDetails.findOne({ userId: userId });

        // if (!userDetails) {
        //     return res.status(404).json({ status: 404, message: 'User details not found', data: null });
        // }

        const refundCharges = await RefundCharge.findOne();
        const refundAmount = booking.depositedMoney
        const newRefund = new Refund({
            booking: booking._id,
            refundAmount: refundAmount,
            refundCharges: refundCharges.refundAmount || 0,
            totalRefundAmount: refundAmount - refundCharges.refundAmount,
            type: "WALLET",
            refundStatus: 'PENDING',
            refundDetails: "WALLET",
            upiId: userDetails.upiId,
            accountNo: userDetails.accountNumber,
            branchName: userDetails.branchName,
            ifscCode: userDetails.ifscCode,
            refundTransactionId: '',
        });


        const savedRefund = await newRefund.save();
        console.log("booking.totalPrice", booking.totalPrice);
        booking.status = 'CANCELLED';
        booking.refundPreference = "WALLET";
        booking.upiId = userDetails.upiId;
        booking.accountNo = userDetails.accountNumber;
        booking.branchName = userDetails.branchName;
        booking.ifscCode = userDetails.ifscCode;
        booking.refund = savedRefund._id;
        await booking.save();
        const welcomeMessage = `Welcome, ${user.mobileNumber}! Your Booking is Complete and your security refund payment is initiated.`;
        const welcomeNotification = new Notification({
            recipient: booking.user._id,
            content: welcomeMessage,
            type: 'welcome',
        });
        await welcomeNotification.save();

        if (updatedBooking.status === "COMPLETED") {
            let line_items = [];
            let name, obj2;
            if (updatedBooking.bike != (null || undefined)) {
                let findBike = await Bike.findOne({ _id: updatedBooking.bike });
                if (findBike) {
                    name = findBike.brand;
                    obj2 = {
                        BikeNmae: name,
                        BikeModel: findBike.model,
                        AboutBike: findBike.aboutBike,
                        BIkeNo: findBike.bikeNumber,
                        BikeType: findBike.type,
                        PickupDate: updatedBooking.pickupDate,
                        DropOffDate: updatedBooking.dropOffDate,
                        PickupTime: updatedBooking.pickupTime,
                        DropOffTime: updatedBooking.dropOffTime,
                        status: updatedBooking.status,
                        paymentStatus: updatedBooking.paymentStatus,
                        depositedMoney: updatedBooking.depositedMoney,
                        tax: updatedBooking.taxAmount,
                        paidAmount: updatedBooking.price,
                        total: updatedBooking.totalPrice,
                    }
                    line_items.push(obj2)
                }
            } else {
                obj2 = {
                    BikeNmae: name,
                    BikeModel: findBike.model,
                    AboutBike: findBike.aboutBike,
                    BIkeNo: findBike.bikeNumber,
                    BikeType: findBike.type,
                    PickupDate: updatedBooking.pickupDate,
                    DropOffDate: updatedBooking.dropOffDate,
                    PickupTime: updatedBooking.pickupTime,
                    DropOffTime: updatedBooking.dropOffTime,
                    status: updatedBooking.status,
                    paymentStatus: updatedBooking.paymentStatus,
                    depositedMoney: updatedBooking.depositedMoney,
                    tax: updatedBooking.taxAmount,
                    paidAmount: updatedBooking.price,
                    total: updatedBooking.totalPrice,
                }
                line_items.push(obj2)
            }
            console.log(obj2);
            let hr = new Date(Date.now()).getHours();
            let date = new Date(Date.now()).getDate();
            if (date < 10) {
                date = '' + 0 + parseInt(date);
            } else {
                date = parseInt(date);
            }
            let month = new Date(Date.now()).getMonth() + 1;
            if (month < 10) {
                month = '' + 0 + parseInt(month);
            } else {
                month = parseInt(month);
            }
            let year = new Date(Date.now()).getFullYear();
            let fullDate = (`${date}/${month}/${year}`).toString();
            let min = new Date(Date.now()).getMinutes();
            if (hr < 10) {
                hr = '' + 0 + parseInt(hr);
            } else {
                hr = parseInt(hr);
            }
            if (min < 10) {
                min = '' + 0 + parseInt(min);
            } else {
                min = parseInt(min);
            }

            let bsa64 = 'data:image/png;base64,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'
            doc.image(`${bsa64}`, 0, 15, { width: 100 }).text('ALKASWA RENTAL PRIVATE LIMITED', 200, 45);
            doc.moveDown();
            doc.moveDown();
            doc.text('A 67, NEW MAN ROAD NOIDA Mob:1234567890', 170, 60)
            doc.moveDown();
            let table1 = [
                ["Booking: Complete", "", "", "", "", "Invoice No: ", `${updatedBooking._id}`],
                [`${user.city}`, "", "", "", "", "Invoice Date :", `${fullDate} ${hr}:${min}`],
                [`Tel: ${user.mobileNumber || "XXXXX"}`, "", "", "", "", "", ``],
            ]
            const tableArray = {
                headers: ["INVOICE To", "", "", "", "", "", "INVOICE", ""],
                rows: table1,
            };
            doc.moveDown();
            doc.moveDown();
            doc.moveDown();
            doc.table(tableArray, { width: 550, x: 15, y: 0 }); // A4 595.28 x 841.89 (portrait) (about width sizes)
            const table = {
                headers: [
                    { label: "#", property: 'Sno', width: 15, renderer: null },
                    { label: "BikeNmae", property: 'BikeNmae', width: 55, renderer: null },
                    { label: "BikeModel", property: 'BikeModel', width: 55, renderer: null },
                    { label: "AboutBike", property: 'AboutBike', width: 95, renderer: null },
                    { label: "BIkeNo", property: 'BIkeNo', width: 60, renderer: null },
                    { label: "status", property: 'status', width: 55, renderer: null },
                    { label: "paymentStatus", property: 'paymentStatus', width: 55, renderer: null },

                    {
                        label: "Price", property: 'paidAmount', width: 35,
                        renderer: (value, indexColumn, indexRow, row) => { return `${Number(value).toFixed(2)}` }
                    },
                    {
                        label: "DepositeMoney", property: 'depositedMoney', width: 55,
                        renderer: (value, indexColumn, indexRow, row) => { return `${Number(value).toFixed(2)}` }
                    },
                ],
                datas: line_items,
            };
            doc.moveDown();
            doc.table(table, {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(6),
                prepareRow: (row, indexColumn, indexRow, rectRow) => doc.font("Helvetica").fontSize(6),
            });

            doc.moveDown();
            let table13 = [
                ["", "", "", "", "", "TAX AMOUNT", "", "AMOUNT"],
                ["ALKASWA RENTAL", "PRIVATE LIMITED", "", "", "", `₹${updatedBooking?.taxAmount}`, "", `₹${updatedBooking?.totalPrice}`],
            ]
            const tableArray4 = {
                headers: ["", "", "", "", "", "", "", ""],
                rows: table13,
            };
            doc.table(tableArray4, { width: 550, x: 10, y: 0 });
            doc.text('VAT NO: GB350971689    CO RegNo:1139394    AWRS NO: XVAW00000113046', 115, 690).font("Helvetica").fontSize(16);
            doc.text('THANK YOU FOR YOUR VALUE CUSTOM', 100, 710).font("Helvetica").fontSize(8);
            doc.text('GOODS WITHOUT ENGLISH INGREDIENTS SHOULD BE LABELLED ACCORDINGLY BEFORE SALE', 98, 725).font("Helvetica").fontSize(5);
            doc.text('The goods once sold will not be returnable unless agreed. Pallet must be returned or a charge will be made', 110, 735).font("Helvetica").fontSize(35);
            let pdfBuffer = await new Promise((resolve) => {
                let chunks = [];
                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.end();
            });
            console.log("pdfBuffer", pdfBuffer);

            // const tempDir = path.join(__dirname, 'temp');
            const tempDir = '/tmp';

            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir);
            }
            const tempFilePath = path.join(tempDir, 'document.pdf');

            fs.writeFileSync(tempFilePath, pdfBuffer);
            console.log("tempFilePath", tempFilePath);


            const cloudinaryUploadResponse = await cloudinary.uploader.upload(tempFilePath, {
                folder: 'pdfs',
                resource_type: 'raw'
            });

            fs.unlinkSync(tempFilePath);

            updatedBooking.pdfLink = cloudinaryUploadResponse.secure_url;
            await updatedBooking.save();
            console.log("updatedBooking.pdfLink", updatedBooking.pdfLink);

            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    "user": "princegap001@gmail.com",
                    "pass": "scjiukvmscijgvpt"
                }
            });
            var mailOptions = {
                from: "<do_not_reply@gmail.com>",
                to: `${user.email}`,
                subject: 'PDF Attachment',
                text: 'Please find the attached PDF.',
                attachments: {
                    filename: 'document.pdf',
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                },
            };
            let info = await transporter.sendMail(mailOptions);
            if (info) {
                var mailOptions1 = {
                    from: "<do_not_reply@gmail.com>",
                    to: `princegap001@gmail.com`,
                    subject: 'Booking Recived',
                    text: `Booking has been Completed ${updatedBooking._id}`,
                };
                let info1 = await transporter.sendMail(mailOptions1);
            }
        }

        return res.status(200).send({ status: 200, message: "OTP verified successfully", data: updatedBooking });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: "Internal server error" + err.message });
    }
};

exports.approveTripEndDetailsResendOTP = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const { id } = req.params;

        const isPartnerAssociated = await Store.exists({ partner: partnerId });

        if (!isPartnerAssociated) {
            return res.status(403).json({ status: 403, message: 'Unauthorized. Partner is not associated with the store.', data: null });
        }

        const otp = newOTP.generate(6, { alphabets: false, upperCase: false, specialChar: false });

        const updated = await Booking.findOneAndUpdate(
            { _id: id },
            { tripEndOtp: otp, isTripEndOtp: false },
            { new: true }
        );

        return res.status(200).send({ status: 200, message: "OTP resent", data: updated });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: 500, message: "Server error" + error.message });
    }
};

exports.getAllOrdersForPartner = async (req, res) => {
    try {
        const partnerId = req.user._id;

        const isPartnerAssociated = await Store.exists({ partner: partnerId });
        console.log("isPartnerAssociated", isPartnerAssociated);
        if (!isPartnerAssociated) {
            return res.status(403).json({ status: 403, message: 'Unauthorized. Partner is not associated with any store.', data: null });
        }

        const bikeRelations = await BikeStoreRelation.find({ partner: partnerId, store: isPartnerAssociated }).populate('accessory');
        console.log("bikeRelations", bikeRelations);

        const partnerAccessories = bikeRelations.map(relation => relation.accessory);
        console.log("partnerAccessories", partnerAccessories);

        const orders = await Order.find({ 'items.accessory': { $in: partnerAccessories.map(accessory => accessory._id) } })
            .populate('user')
            .populate('items.accessory')
            .populate('shippingAddress');

        return res.status(200).json({
            status: 200,
            message: 'Orders retrieved successfully for the partner',
            data: orders,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getOrderByIdForPartner = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const orderId = req.params.orderId;

        const isPartnerAssociated = await Store.exists({ partner: partnerId });
        if (!isPartnerAssociated) {
            return res.status(403).json({ status: 403, message: 'Unauthorized. Partner is not associated with the store.', data: null });
        }

        const bikeRelations = await BikeStoreRelation.find({ partner: partnerId, store: isPartnerAssociated }).populate('accessory');
        const partnerAccessories = bikeRelations.map(relation => relation.accessory);

        const order = await Order.findById(orderId).populate('items.accessory').populate('shippingAddress').populate('user').populate({
            path: 'storeId',
            populate: { path: 'partner' }
        });

        if (!order) {
            return res.status(404).json({ status: 404, message: 'Order not found', data: null });
        }

        const isOrderAssociatedWithPartner = order.items.every(item => partnerAccessories.some(accessory => accessory._id.equals(item.accessory._id)));

        if (!isOrderAssociatedWithPartner) {
            return res.status(403).json({ status: 403, message: 'Unauthorized. Order is not associated with the partner.', data: null });
        }

        return res.status(200).json({
            status: 200,
            message: 'Order retrieved successfully for the partner',
            data: order,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.updateOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const validStatusValues = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
        if (!validStatusValues.includes(status)) {
            return res.status(400).json({
                status: 400,
                message: 'Invalid order status',
                data: null,
            });
        }

        let otp = '';
        try {
            otp = newOTP.generate(6, { alphabets: false, upperCase: false, specialChar: false });
        } catch (otpError) {
            console.error('Error generating OTP:', otpError);
            return res.status(500).json({
                status: 500,
                message: 'Error generating OTP',
                data: null,
            });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
                status,
                orderOtp: otp,
                isOrderOtp: false,
                orderDeliveredDate: new Date(),
            },
            { new: true }
        ).populate('user').populate('items.accessory').populate('shippingAddress');

        if (!updatedOrder) {
            return res.status(404).json({
                status: 404,
                message: 'Order not found',
                data: null,
            });
        }

        const welcomeMessage = `Welcome, ${updatedOrder.user.mobileNumber}! You Order Status is ${updatedOrder.status}.`;
        const welcomeNotification = new Notification({
            recipient: updatedOrder.user._id,
            content: welcomeMessage,
            type: 'welcome',
        });
        await welcomeNotification.save();

        return res.status(200).json({
            status: 200,
            message: 'Order updated successfully',
            data: updatedOrder,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 500,
            message: 'Server error',
            data: null,
        });
    }
};

exports.orderVerifyOtp = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const orderId = req.params.orderId;
        const { otp } = req.body;

        const isPartnerAssociated = await Store.exists({ partner: partnerId });

        if (!isPartnerAssociated) {
            return res.status(403).json({ status: 403, message: 'Unauthorized. Partner is not associated with the store.', data: null });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ status: 404, message: 'Order not found', data: null });
        }

        const userId = order.user;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        console.log("order.orderOtp", order.orderOtp);
        if (order.orderOtp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
                isOrderOtp: true,
            },
            { new: true }
        );

        return res.status(200).send({ status: 200, message: "OTP verified successfully", data: updatedOrder });
    } catch (err) {
        console.error(err.message);
        return res.status(500).send({ error: "Internal server error" + err.message });
    }
};

exports.orderResendOTP = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const { id } = req.params;

        const isPartnerAssociated = await Store.exists({ partner: partnerId });

        if (!isPartnerAssociated) {
            return res.status(403).json({ status: 403, message: 'Unauthorized. Partner is not associated with the store.', data: null });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ status: 400, message: 'Invalid order ID', data: null });
        }

        let otp;
        try {
            otp = newOTP.generate(6, { alphabets: false, upperCase: false, specialChar: false });
        } catch (otpError) {
            console.error('Error generating OTP:', otpError);
            return res.status(500).json({ status: 500, message: 'Error generating OTP', data: null });
        }

        const updated = await Order.findOneAndUpdate(
            { _id: id },
            { orderOtp: otp, isOrderOtp: false },
            { new: true }
        );

        return res.status(200).json({ status: 200, message: 'OTP resent', data: updated });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error' + error.message });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        const deletedOrder = await Order.findByIdAndDelete(orderId).populate('user').populate('items.accessory').populate('shippingAddress');

        if (!deletedOrder) {
            return res.status(404).json({
                status: 404,
                message: 'Order not found',
                data: null,
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'Order deleted successfully',
            data: deletedOrder,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 500,
            message: 'Server error',
            data: null,
        });
    }
};

exports.getQrCodeForVendor = async (req, res) => {
    try {
        const partnerId = req.user._id;

        const user = await User.findById(partnerId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.json({
            data: {
                qrCode: user.qrCode,
                user
            }
        });
    } catch (error) {
        console.error('Error getting QR Code:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.markNotificationAsRead = async (req, res) => {
    try {
        const notificationId = req.params.notificationId;

        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { status: 'read' },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ status: 404, message: 'Notification not found' });
        }

        return res.status(200).json({ status: 200, message: 'Notification marked as read', data: notification });
    } catch (error) {
        return res.status(500).json({ status: 500, message: 'Error marking notification as read', error: error.message });
    }
};

exports.markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const notifications = await Notification.updateMany(
            { recipient: userId, },
            { status: 'read' }
        );

        if (!notifications) {
            return res.status(404).json({ status: 404, message: 'No notifications found for the user' });
        }

        return res.status(200).json({ status: 200, message: 'All notifications marked as read for the user', data: notifications });
    } catch (error) {
        return res.status(500).json({ status: 500, message: 'Error marking notifications as read', error: error.message });
    }
};

exports.getNotificationsById = async (req, res) => {
    try {
        const userId = req.user._id;
        const notificationId = req.params.notificationId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const notifications = await Notification.find({ recipient: userId, _id: notificationId });

        return res.status(200).json({ status: 200, message: 'Notifications retrieved successfully', data: notifications });
    } catch (error) {
        return res.status(500).json({ status: 500, message: 'Error retrieving notifications', error: error.message });
    }
};

exports.getAllNotificationsForUser = async (req, res) => {
    try {
        const userId = req.user._id;
        console.log(userId);
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
        }
        const notifications = await Notification.find({ recipient: userId });

        return res.status(200).json({ status: 200, message: 'Notifications retrieved successfully', data: notifications });
    } catch (error) {
        return res.status(500).json({ status: 500, message: 'Error retrieving notifications', error: error.message });
    }
};