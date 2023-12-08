const User = require('../models/userModel');
const authConfig = require("../configs/auth.config");
const jwt = require("jsonwebtoken");
const newOTP = require("otp-generators");
const bcrypt = require("bcryptjs");
const City = require('../models/cityModel');
const Bike = require('../models/bikeModel');
const Location = require("../models/locationModel");
const Booking = require('../models/bookingModel');
const Store = require('../models/storeModel');
const BikeStoreRelation = require('../models/BikeStoreRelationModel');
const Coupon = require('../models/couponModel');



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

        const booking = await Booking.findById(bookingId).populate('bike');

        const storeId = booking.bike.store;
        const isPartnerAssociated = await Store.exists({ _id: storeId, partner: partnerId });

        if (!isPartnerAssociated) {
            return res.status(403).json({ status: 403, message: 'Unauthorized. Partner is not associated with the store.', data: null });
        }

        booking.status = 'APPROVED';
        await booking.save();

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




