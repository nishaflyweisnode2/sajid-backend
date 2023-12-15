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

        const booking = await Booking.findById(bookingId).populate('bike');

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
        const bookingId = req.params.bookingId;
        const { tripEndKm, remarks } = req.query;

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
        booking.isTripCompleted = true;
        booking.status = "COMPLETED";

        const updatedBooking = await booking.save();

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
            },
            { new: true }
        );


        return res.status(200).send({ status: 200, message: "OTP verified successfully", data: updatedBooking });
    } catch (err) {
        console.error(err.message);
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


