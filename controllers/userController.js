const User = require('../models/userModel');
const authConfig = require("../configs/auth.config");
const jwt = require("jsonwebtoken");
const newOTP = require("otp-generators");
const City = require('../models/cityModel');
const Bike = require('../models/bikeModel');
const Location = require("../models/locationModel");
const Booking = require('../models/bookingModel');
const Coupon = require('../models/couponModel');
const BikeStoreRelation = require('../models/BikeStoreRelationModel');
const AccessoryCategory = require('../models/accessory/accessoryCategoryModel')
const Accessory = require('../models/accessory/accessoryModel')



const reffralCode = async () => {
    var digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let OTP = '';
    for (let i = 0; i < 9; i++) {
        OTP += digits[Math.floor(Math.random() * 36)];
    }
    return OTP;
}

exports.loginWithPhone = async (req, res) => {
    try {
        const { mobileNumber } = req.body;

        if (mobileNumber.replace(/\D/g, '').length !== 10) {
            return res.status(400).send({ status: 400, message: "Invalid mobileNumber number length" });
        }

        const user = await User.findOne({ mobileNumber: mobileNumber, userType: "USER" });
        if (!user) {
            let otp = newOTP.generate(6, { alphabets: false, upperCase: false, specialChar: false });
            let otpExpiration = new Date(Date.now() + 60 * 1000);
            let accountVerification = false;
            const newUser = await User.create({ mobileNumber: mobileNumber, otp, otpExpiration, accountVerification, userType: "USER" });
            let obj = { id: newUser._id, otp: newUser.otp, mobileNumber: newUser.mobileNumber }
            return res.status(200).send({ status: 200, message: "logged in successfully", data: obj });
        } else {
            const userObj = {};
            userObj.otp = newOTP.generate(6, { alphabets: false, upperCase: false, specialChar: false });
            userObj.otpExpiration = new Date(Date.now() + 60 * 1000);
            userObj.accountVerification = false;
            const updated = await User.findOneAndUpdate({ mobileNumber: mobileNumber, userType: "USER" }, userObj, { new: true });
            let obj = { id: updated._id, otp: updated.otp, mobileNumber: updated.mobileNumber }
            return res.status(200).send({ status: 200, message: "logged in successfully", data: obj });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send({ message: "user not found" });
        }
        console.log("Current Time:", new Date());
        console.log("OTP Expiration:", user.otpExpiration);

        if (user.otp !== otp || user.otpExpiration < Date.now()) {
            console.log("Invalid or expired OTP");
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }
        const updated = await User.findByIdAndUpdate({ _id: user._id }, { accountVerification: true }, { new: true });
        const accessToken = await jwt.sign({ id: user._id }, authConfig.secret, {
            expiresIn: authConfig.accessTokenTime,
        });
        let obj = {
            userId: updated._id,
            otp: updated.otp,
            mobileNumber: updated.mobileNumber,
            token: accessToken,
            completeProfile: updated.completeProfile
        }
        return res.status(200).send({ status: 200, message: "logged in successfully", data: obj });
    } catch (err) {
        console.log(err.message);
        return res.status(500).send({ error: "internal server error" + err.message });
    }
};

exports.resendOTP = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findOne({ _id: id, userType: "USER" });
        if (!user) {
            return res.status(404).send({ status: 404, message: "User not found" });
        }
        const otp = newOTP.generate(6, { alphabets: false, upperCase: false, specialChar: false, });
        const otpExpiration = new Date(Date.now() + 60 * 1000);
        const accountVerification = false;
        const updated = await User.findOneAndUpdate({ _id: user._id }, { otp, otpExpiration, accountVerification }, { new: true });
        let obj = {
            id: updated._id,
            otp: updated.otp,
            mobileNumber: updated.mobileNumber
        }
        return res.status(200).send({ status: 200, message: "OTP resent", data: obj });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: 500, message: "Server error" + error.message });
    }
};

exports.registration = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user._id });
        if (user) {
            if (req.body.refferalCode == null || req.body.refferalCode == undefined) {
                req.body.otp = newOTP.generate(4, { alphabets: false, upperCase: false, specialChar: false, });
                req.body.otpExpiration = new Date(Date.now() + 60 * 1000);
                req.body.accountVerification = true;
                req.body.refferalCode = await reffralCode();
                req.body.completeProfile = true;
                const userCreate = await User.findOneAndUpdate({ _id: user._id }, req.body, { new: true, });
                let obj = { id: userCreate._id, completeProfile: userCreate.completeProfile, phone: userCreate.phone }
                return res.status(200).send({ status: 200, message: "Registered successfully ", data: obj, });
            } else {
                const findUser = await User.findOne({ refferalCode: req.body.refferalCode });
                if (findUser) {
                    req.body.otp = newOTP.generate(6, { alphabets: false, upperCase: false, specialChar: false, });
                    req.body.otpExpiration = new Date(Date.now() + 60 * 1000);
                    req.body.accountVerification = true;
                    req.body.userType = "USER";
                    req.body.refferalCode = await reffralCode();
                    req.body.refferUserId = findUser._id;
                    req.body.completeProfile = true;
                    const userCreate = await User.findOneAndUpdate({ _id: user._id }, req.body, { new: true, });
                    if (userCreate) {
                        let updateWallet = await User.findOneAndUpdate({ _id: findUser._id }, { $push: { joinUser: userCreate._id } }, { new: true });
                        let obj = { id: userCreate._id, completeProfile: userCreate.completeProfile, phone: userCreate.phone }
                        return res.status(200).send({ status: 200, message: "Registered successfully ", data: obj, });
                    }
                } else {
                    return res.status(404).send({ status: 404, message: "Invalid refferal code", data: {} });
                }
            }
        } else {
            return res.status(404).send({ status: 404, msg: "Not found" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.uploadIdPicture = async (req, res) => {
    try {
        const userId = req.user._id;

        if (!req.file) {
            return res.status(400).json({ status: 400, error: "Image file is required" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { 'uploadId.frontImage': req.file.path } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        return res.status(200).json({ status: 200, message: 'Uploaded successfully', data: updatedUser.uploadId.frontImage });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to upload profile picture', error: error.message });
    }
};

exports.updateDocuments = async (req, res) => {
    try {
        const userId = req.user._id;

        const { uploadId, drivingLicense } = req.body;

        const updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            {
                $set: {
                    'uploadId.frontImage': uploadId.frontImage || null,
                    'uploadId.backImage': uploadId.backImage || null,
                    'drivingLicense.frontImage': drivingLicense.frontImage || null,
                    'drivingLicense.backImage': drivingLicense.backImage || null,
                },
            },
            { new: true }
        );

        if (updatedUser) {
            return res.status(200).json({ status: 200, message: 'Documents updated successfully', data: updatedUser });
        } else {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.updateLocation = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user._id });
        if (!user) {
            return res.status(404).send({ status: 404, message: "User not found" });
        }

        let updateFields = {};

        if (req.body.currentLat || req.body.currentLong) {
            const coordinates = [parseFloat(req.body.currentLat), parseFloat(req.body.currentLong)];
            updateFields.currentLocation = { type: "Point", coordinates };
        }

        if (req.body.state) {
            updateFields.state = req.body.state;
            updateFields.isState = true;
        }

        if (req.body.city) {
            updateFields.city = req.body.city;
            updateFields.isCity = true;
        }

        const updatedUser = await User.findByIdAndUpdate(
            { _id: user._id },
            { $set: updateFields },
            { new: true }
        );

        if (updatedUser) {
            let obj = {
                currentLocation: updatedUser.currentLocation,
                state: updatedUser.state,
                city: updatedUser.city,
            };
            return res.status(200).send({ status: 200, message: "Location update successful.", data: obj });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: 500, message: "Server error" + error.message });
    }
};

exports.uploadProfilePicture = async (req, res) => {
    try {
        const userId = req.user._id;

        if (!req.file) {
            return res.status(400).json({ status: 400, error: "Image file is required" });
        }

        const updatedUser = await User.findByIdAndUpdate(userId, { image: req.file.path, }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        return res.status(200).json({ status: 200, message: 'Profile Picture Uploaded successfully', data: updatedUser });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to upload profile picture', error: error.message });
    }
};

exports.editProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const { firstName, lastName, email, mobileNumber } = req.body;

        const updateObject = {};
        if (firstName) updateObject.firstName = firstName;
        if (lastName) updateObject.lastName = lastName;
        if (email) updateObject.email = email;
        if (mobileNumber) updateObject.mobileNumber = mobileNumber;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateObject },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        return res.status(200).json({ status: 200, message: 'Edit Profile updated successfully', data: updatedUser });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId).populate('city');
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const memberSince = user.createdAt.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
        });

        return res.status(200).json({
            status: 200,
            data: {
                user,
                memberSince,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.getUserProfileById = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const memberSince = user.createdAt.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
        });

        return res.status(200).json({
            status: 200, data: {
                user,
                memberSince,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.getAllCities = async (req, res) => {
    try {
        const cities = await City.find();

        res.status(200).json({
            status: 200,
            message: 'Cities retrieved successfully',
            data: cities,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getCityById = async (req, res) => {
    try {
        const city = await City.findById(req.params.id);

        if (!city) {
            return res.status(404).json({ message: 'City not found' });
        }

        res.status(200).json({
            status: 200,
            message: 'City retrieved successfully',
            data: city,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllBikes = async (req, res) => {
    try {
        const bikes = await Bike.find();

        return res.status(200).json({ status: 200, data: bikes });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Server error' });
    }
};

exports.getBikeById = async (req, res) => {
    try {
        const bikeId = req.params.id;
        const bike = await Bike.findById(bikeId);

        if (!bike) {
            return res.status(404).json({ status: 404, message: 'Bike not found' });
        }

        return res.status(200).json({ status: 200, data: bike });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Server error' });
    }
};

exports.getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find();
        res.status(200).json({ status: 200, data: coupons });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, error: 'Server error' });
    }
};

exports.getCouponById = async (req, res) => {
    try {
        const couponId = req.params.id;
        const coupon = await Coupon.findById(couponId);

        if (!coupon) {
            return res.status(404).json({ status: 404, message: 'Coupon not found' });
        }

        res.status(200).json({ status: 200, data: coupon });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, error: 'Server error' });
    }
};

exports.getAllAccessoryCategories = async (req, res) => {
    try {
        const categories = await AccessoryCategory.find();

        return res.status(200).json({
            status: 200,
            message: 'Accessory categories retrieved successfully',
            data: categories,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getAccessoryCategoryById = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const category = await AccessoryCategory.findById(categoryId);

        if (!category) {
            return res.status(404).json({ status: 404, message: 'Accessory category not found', data: null });
        }

        return res.status(200).json({ status: 200, message: 'Accessory category retrieved successfully', data: category });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getAllAccessories = async (req, res) => {
    try {
        const accessories = await Accessory.find().populate('category');

        return res.status(200).json({
            status: 200,
            message: 'Accessories retrieved successfully',
            data: accessories,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getAccessoryById = async (req, res) => {
    try {
        const accessoryId = req.params.accessoryId;
        const accessory = await Accessory.findById(accessoryId).populate('category');

        if (!accessory) {
            return res.status(404).json({ status: 404, message: 'Accessory not found', data: null });
        }

        return res.status(200).json({ status: 200, message: 'Accessory retrieved successfully', data: accessory });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getAllAccessoriesByCategoryId = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;

        const category = await AccessoryCategory.findById(categoryId);
        if (!category) {
            return res.status(400).json({ status: 400, message: 'Invalid accessory category ID', data: null });
        }

        const accessories = await Accessory.find({ category: categoryId });

        return res.status(200).json({
            status: 200,
            message: 'Accessories retrieved successfully by category ID',
            data: accessories,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.checkBikeAvailability = async (req, res) => {
    try {
        const { pickupDate, dropOffDate, pickupTime, dropOffTime } = req.query;

        const startDateTime = new Date(`${pickupDate}T${pickupTime}`);
        const endDateTime = new Date(`${dropOffDate}T${dropOffTime}`);

        const bookedBikes = await Booking.find({
            $and: [
                {
                    $or: [
                        {
                            $and: [
                                { 'pickupTime': { $lte: pickupTime } },
                                { 'dropOffTime': { $gte: dropOffTime } },
                            ],
                        },
                        {
                            $and: [
                                { 'pickupTime': { $gte: pickupTime } },
                                { 'dropOffTime': { $lte: dropOffTime } },
                            ],
                        },
                    ],
                    $or: [
                        {
                            $and: [
                                { 'pickupDate': { $lte: pickupDate } },
                                { 'dropOffDate': { $gte: dropOffDate } },
                            ],
                        },
                        {
                            $and: [
                                { 'pickupDate': { $lte: pickupDate } },
                                { 'dropOffDate': { $gte: dropOffDate } },
                            ],
                        },
                    ],
                },
                {
                    $or: [
                        { 'status': 'APPROVED', 'isTripCompleted': false },
                        {
                            'isTimeExtended': true,
                            'timeExtendedDropOffTime': { $gte: startDateTime, $lte: endDateTime },
                        },
                    ],
                },
            ],
        });
        const bookedBikeIds = bookedBikes.map(booking => booking.bike);

        const bike = await Bike.find();
        const unavailableBikeIds = await BikeStoreRelation.find({
            bike: { $in: bike },
            totalNumberOfBookedBikes: { $gt: 0 },
        }).distinct('bike');

        let availableBikes = {};

        if (bookedBikeIds) {
            availableBikes = await Bike.find({
                _id: { $nin: bookedBikeIds, /*$nin: unavailableBikeIds */ },
                isOnTrip: false,
                isAvailable: true,
                nextAvailableDateTime: { $gte: startDateTime, $lte: endDateTime },
            });
        } else if (unavailableBikeIds) {
            availableBikes = await Bike.find({
                _id: {/* $nin: bookedBikeIds, */ $nin: unavailableBikeIds },
                isOnTrip: false,
                isAvailable: true,
                nextAvailableDateTime: { $gte: startDateTime, $lte: endDateTime },
            });
        } else {
            availableBikes = await Bike.find({
                _id: { $nin: bookedBikeIds, $nin: unavailableBikeIds },
                isOnTrip: false,
                isAvailable: true,
                nextAvailableDateTime: { $gte: startDateTime, $lte: endDateTime },
            });
        }

        return res.status(200).json({ status: 200, data: availableBikes });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'An error occurred while checking Bike availability' });
    }
};

exports.createBooking = async (req, res) => {
    try {
        const userId = req.user._id;
        const { bikeId, pickupDate, /*dropOffDate,*/ pickupTime, dropOffTime, subscriptionMonths } = req.body;
        let dropOffDate;

        const currentDate = new Date();
        const requestedPickupDate = new Date(`${pickupDate}T${pickupTime}:00.000Z`);

        if (!subscriptionMonths || subscriptionMonths <= 0) {
            return res.status(400).json({ status: 400, message: 'Invalid subscription duration', data: null });
        }

        dropOffDate = new Date(requestedPickupDate);
        dropOffDate.setMonth(dropOffDate.getMonth() + subscriptionMonths);

        if (requestedPickupDate < currentDate) {
            return res.status(400).json({ status: 400, message: 'Invalid pickup date. Pickup date cannot be earlier than the current date.', data: null });
        }

        const existingBooking = await Booking.findOne({ bike: bikeId, pickupDate, pickupTime, dropOffDate, dropOffTime, isTripCompleted: false, });

        if (existingBooking) {
            return res.status(400).json({
                status: 400, message: 'Bike is already booked for the specified pickup date and time.', data: null,
            });
        }

        const existingExtendedBooking = await Booking.findOne({
            bike: bikeId,
            extendedDropOffDate: pickupDate || extendedDropOffDate,
            extendedDropOffTime: pickupTime || extendedDropOffTime,
            isTripCompleted: false,
        });

        if (existingExtendedBooking) {
            return res.status(400).json({
                status: 400, message: 'Bike is already booked for the specified extended drop-off date and time.', data: null,
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
        }

        if (user.isVerified === false) {
            return res.status(404).json({ status: 404, message: 'User can not book bike first approved account by admin', data: null });
        }

        const bikeExist = await Bike.findById(bikeId);
        if (!bikeExist) {
            return res.status(400).json({ status: 400, message: 'Bike not available', data: null });
        }

        const rentalPrice = bikeExist.rentalPrice;
        console.log("rentalPrice", rentalPrice);

        const durationInDays = calculateDurationInDays(pickupDate, dropOffDate, pickupTime, dropOffTime);
        console.log("durationInDays", durationInDays);

        const basePrice = rentalPrice * durationInDays;
        const taxAmount = (3 / 100) * basePrice;
        const totalPrice = basePrice + taxAmount;

        console.log("totalPrice", totalPrice);

        if (isNaN(totalPrice) || totalPrice < 0) {
            return res.status(400).json({ status: 400, message: 'Invalid totalPrice', data: null });
        }

        const roundedBasePrice = Math.round(basePrice);
        const roundedTaxAmount = Math.round(taxAmount);
        const roundedTotalPrice = Math.round(totalPrice);

        const newBooking = await Booking.create({
            user: user._id,
            bike: bikeExist._id,
            pickupLocation: bikeExist.pickup,
            dropOffLocation: bikeExist.drop,
            pickupDate,
            dropOffDate,
            pickupTime,
            dropOffTime,
            status: "PENDING",
            price: roundedBasePrice,
            taxAmount: roundedTaxAmount,
            totalPrice: roundedTotalPrice,
            depositedMoney: bikeExist.depositMoney,
            isSubscription: true,
            subscriptionMonths,
        });

        return res.status(201).json({ status: 201, message: 'Booking created successfully', data: newBooking });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

function calculateDurationInDays(pickupDate, dropOffDate, pickupTime, dropOffTime) {
    const pickupDateTime = new Date(`${pickupDate}T${pickupTime}:00.000Z`);
    console.log("pickupDateTime", pickupDateTime);

    const dropOffDateTime = new Date(`${dropOffDate}T${dropOffTime}:00.000Z`);
    console.log("dropOffDateTime", dropOffDateTime);

    const durationInMilliseconds = dropOffDateTime - pickupDateTime;
    console.log("durationInMilliseconds", durationInMilliseconds);

    const durationInDays = durationInMilliseconds / (1000 * 60 * 60 * 24);
    console.log("durationInDays", durationInDays);

    return durationInDays;
}

exports.getBookingsByUser = async (req, res) => {
    try {
        const userId = req.user._id;

        const bookings = await Booking.find({ user: userId }).populate('bike user pickupLocation dropOffLocation');

        // .populate({
        //     path: 'bike',
        //     select: 'modelName rentalPrice',
        // })
        // .populate({
        //     path: 'user',
        //     select: 'username email',
        // })
        // .populate({
        //     path: 'pickupLocation dropOffLocation',
        //     select: 'locationName address',
        // });

        return res.status(200).json({ status: 200, message: 'Bookings retrieved successfully', data: bookings });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.updateBookingById = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!booking) {
            return res.status(404).json({ status: 404, message: 'Booking not found', data: null });
        }
        return res.status(200).json({ status: 200, message: 'Booking updated successfully', data: booking });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.applyCouponToBooking = async (req, res) => {
    try {
        const { bookingId, couponCode } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ status: 404, message: 'Booking not found', data: null });
        }

        if (booking.isCouponApplied) {
            return res.status(400).json({ status: 400, message: 'Coupon has already been applied to this booking', data: null });
        }

        const coupon = await Coupon.findOne({ code: couponCode });
        if (!coupon || !coupon.isActive || new Date(coupon.expirationDate) < new Date()) {
            return res.status(400).json({ status: 400, message: 'Invalid or expired coupon code', data: null });
        }

        booking.offerCode = couponCode;
        booking.discountPrice = Math.round(booking.totalPrice * (coupon.discount / 100));
        booking.totalPrice = Math.round(booking.totalPrice - booking.discountPrice);
        booking.isCouponApplied = true;

        await booking.save();

        return res.status(200).json({ status: 200, message: 'Coupon applied successfully', data: booking });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.removeCouponFromBooking = async (req, res) => {
    try {
        const { bookingId } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ status: 404, message: 'Booking not found', data: null });
        }

        booking.totalPrice = Math.round(booking.totalPrice + booking.discountPrice);

        booking.offerCode = null;
        booking.discountPrice = 0;

        booking.isCouponApplied = false;

        await booking.save();

        return res.status(200).json({ status: 200, message: 'Coupon removed successfully', data: booking });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.updatePaymentStatus = async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const { paymentStatus } = req.body;

        const updatedBooking = await Booking.findOne({ _id: bookingId });

        const validStatusValues = ['PENDING', 'FAILED', 'PAID'];
        if (!validStatusValues.includes(paymentStatus)) {
            return res.status(400).json({ error: "Invalid Payment status value" });
        }

        updatedBooking.paymentStatus = paymentStatus;

        if (paymentStatus === 'PAID') {
            const bikeId = updatedBooking.bike;

            const bike = await Bike.findOne({ _id: bikeId });

            bike.rentalCount += 1;

            await bike.save();
        }

        await updatedBooking.save();

        return res.status(200).json({
            status: 200,
            message: 'Payment status updated successfully',
            data: updatedBooking,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 500,
            message: 'Server error while updating payment status',
            data: null,
        });
    }
};

const isBikeAvailableForPeriod = async (bikeId, pickupDate, dropOffDate, pickupTime, dropOffTime, extendedDropOffDate, extendedDropOffTime) => {
    const startTime = new Date(`${pickupDate}T${pickupTime}`);
    const endTime = new Date(`${dropOffDate}T${dropOffTime}`);
    const extendTime = new Date(`${extendedDropOffDate}T${extendedDropOffTime}`);

    const existingBookings = await Booking.find({
        bike: bikeId,
        isTripCompleted: false,
        $or: [
            { pickupTime: { $lt: endTime }, dropOffTime: { $gt: startTime } },
            { pickupTime: { $lt: startTime }, dropOffTime: { $gt: startTime } },
            { $and: [{ extendedDropOffTime: { $lt: extendTime } }, { dropOffTime: { $gt: extendTime } }] },
        ],
    });

    return existingBookings.length === 0;
};

exports.extendBooking = async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const { extendedDropOffDate, extendedDropOffTime } = req.body;

        const extendedBooking = await Booking.findById(bookingId);
        if (!extendedBooking) {
            return res.status(404).send("Booking not found");
        }

        const isAvailable = await isBikeAvailableForPeriod(
            extendedBooking.bike,
            extendedBooking.pickupDate,
            extendedBooking.dropOffDate,
            extendedBooking.pickupTime,
            extendedBooking.dropOffTime
        );

        if (!isAvailable) {
            return res.status(400).send("Bike is not available for the extended period");
        }

        extendedBooking.isTimeExtended = true;
        extendedBooking.extendedDropOffDate = extendedDropOffDate;
        extendedBooking.extendedDropOffTime = extendedDropOffTime;

        await extendedBooking.save();

        return res.status(200).json({
            status: 200,
            message: 'Booking extended successfully',
            data: extendedBooking,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 500,
            message: 'Server error while extending booking',
            data: null,
        });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const bookingId = req.params.bookingId;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ status: 404, message: 'Booking not found', data: null });
        }

        if (booking.status === 'CANCELLED' || booking.isTripCompleted) {
            return res.status(400).json({ status: 400, message: 'Booking is not cancellable', data: null });
        }

        if (booking.paymentStatus === 'PAID') {
            const bikeId = booking.bike;
            const bike = await Bike.findById(bikeId);
            if (bike) {
                bike.rentalCount -= 1;
                await bike.save();
            }
        }

        booking.status = 'CANCELLED';
        await booking.save();

        return res.status(200).json({ status: 200, message: 'Booking cancelled successfully', data: booking });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};




