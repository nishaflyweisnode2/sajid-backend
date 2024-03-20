const User = require('../models/userModel');
const authConfig = require("../configs/auth.config");
const jwt = require("jsonwebtoken");
const newOTP = require("otp-generators");
const City = require('../models/cityModel');
const Bike = require('../models/bikeModel');
const Location = require("../models/bikeLocationModel");
const Address = require("../models/userAddressModel");
const Booking = require('../models/bookingModel');
const Coupon = require('../models/couponModel');
const BikeStoreRelation = require('../models/BikeStoreRelationModel');
const AccessoryCategory = require('../models/accessory/accessoryCategoryModel')
const Accessory = require('../models/accessory/accessoryModel')
const Store = require('../models/storeModel');
const GST = require('../models/gstModel');
const HelpAndSupport = require('../models/help&SupportModel');
const Notification = require('../models/notificationModel');
const TermAndCondition = require('../models/term&conditionModel');
const CancelationPolicy = require('../models/cancelationPolicyModel');
const BussinesInquary = require('../models/bussinesInquaryModel');
const Story = require('../models/storyModel');
const Order = require('../models/orderModel');
const RefundCharge = require('../models/refundChargeModel');
const Refund = require('../models/refundModel');
const SubjectsCategory = require('../models/subjectModel');
const firebase = require('../middlewares/firebase');
const PDFDocument = require("pdfkit-table");
const UserDetails = require('../models/userRefundModel');
const doc = new PDFDocument({ autoFirstPage: true, margin: 10, size: 'A4' });
const nodemailer = require('nodemailer')
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const fs = require('fs');
const os = require('os');
const path = require('path');


// Configure Cloudinary with your credentials
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_SECRET,
});



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
            const welcomeMessage = `Welcome, ${newUser.mobileNumber}! Thank you for registering.`;
            const welcomeNotification = new Notification({
                recipient: newUser._id,
                content: welcomeMessage,
                type: 'welcome',
            });
            await welcomeNotification.save();

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
        const { otp, deviceToken } = req.body;
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
        if (deviceToken != (null || undefined)) {
            const updated = await User.findByIdAndUpdate({ _id: user._id }, { $set: { deviceToken: deviceToken, accountVerification: true } }, { new: true });
            const accessToken = await jwt.sign({ id: user._id }, authConfig.secret, {
                expiresIn: authConfig.accessTokenTime,
            });
            let obj = {
                userId: updated._id,
                otp: updated.otp,
                mobileNumber: updated.mobileNumber,
                token: accessToken,
                completeProfile: updated.completeProfile,
                deviceToken: deviceToken
            }
            return res.status(200).send({ status: 200, message: "logged in successfully", data: obj });
        }

        const updated = await User.findByIdAndUpdate({ _id: user._id }, { $set: { accountVerification: true } }, { new: true });
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
                    'uploadId.aadharCardNo': uploadId.aadharCardNo || null,
                    'drivingLicense.frontImage': drivingLicense.frontImage || null,
                    'drivingLicense.backImage': drivingLicense.backImage || null,
                    'drivingLicense.drivingLicenseNo': drivingLicense.drivingLicenseNo || null,
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

exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
        }
        const otp = newOTP.generate(6, { alphabets: false, upperCase: false, specialChar: false, });

        user.otp = otp
        const updatedUser = await user.save();

        return res.status(200).json({
            status: 200,
            message: 'Account deleted successfully',
            data: updatedUser,
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

exports.verifyOtpForDelete = async (req, res) => {
    try {
        const { otp } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send({ message: "user not found" });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: "Invalid" });
        }
        await User.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            status: 200,
            message: 'Account deleted successfully',
            data: null,
        });
    } catch (err) {
        console.log(err.message);
        return res.status(500).send({ error: "internal server error" + err.message });
    }
};

exports.resendOTPForDelete = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findOne({ _id: id, userType: "USER" });
        if (!user) {
            return res.status(404).send({ status: 404, message: "User not found" });
        }
        const otp = newOTP.generate(6, { alphabets: false, upperCase: false, specialChar: false, });
        const updated = await User.findOneAndUpdate({ _id: user._id }, { otp, }, { new: true });
        let obj = {
            otp: updated.otp,
            _id: updated._id
        }
        return res.status(200).send({ status: 200, message: "OTP resent", data: obj });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: 500, message: "Server error" + error.message });
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

exports.createAddress = async (req, res) => {
    try {
        const userId = req.user._id;

        const { name, coordinates, type, address } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const pickupLocation = new Address({
            user: user.id,
            name,
            coordinates,
            type,
            address,
        });

        const savedPickupLocation = await pickupLocation.save();

        res.status(201).json({
            status: 201,
            message: 'Address created successfully',
            data: { pickupLocation: savedPickupLocation },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.getAllAddress = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const address = await Address.find({ user: userId });

        res.status(200).json({ status: 200, data: address });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.getAddressById = async (req, res) => {
    try {
        const addressId = req.params.id;
        const address = await Address.findById(addressId);

        if (!address) {
            return res.status(404).json({ status: 404, message: 'address not found' });
        }

        res.status(200).json({ status: 200, data: address });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.updateAddressById = async (req, res) => {
    try {
        const userId = req.user._id;
        const addressId = req.params.id;
        const updateFields = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const existingAddress = await Address.findById(addressId);

        if (!existingAddress) {
            return res.status(404).json({ status: 404, message: 'Address not found' });
        }

        if (existingAddress.user.toString() !== userId.toString()) {
            return res.status(403).json({ status: 403, message: 'Unauthorized: User does not have permission to update this Address' });
        }

        const updatedAddress = await Address.findByIdAndUpdate(addressId, updateFields, { new: true });

        res.status(200).json({
            status: 200,
            message: 'Address updated successfully',
            data: updatedAddress,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.deleteAddressById = async (req, res) => {
    try {
        const addressId = req.params.id;
        const deletedLocation = await Address.findByIdAndDelete(addressId);

        if (!deletedLocation) {
            return res.status(404).json({ status: 404, message: 'Address not found' });
        }

        res.status(200).json({ status: 200, message: 'Address deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.getAddressByType = async (req, res) => {
    try {
        const { type } = req.params;

        const locations = await Address.find({ type: type });
        console.log(locations);

        if (locations && locations.length > 0) {
            return res.json(locations);
        } else {
            return res.status(404).json({ message: `No address found for type: ${type}` });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: `Failed to retrieve address for type: ${type}` });
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
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const coupons = await Coupon.find({ recipient: userId });

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
        const accessoriesStore = await BikeStoreRelation.find({
            accessory: { $exists: true },
        });

        const availableAccessoriesIds = accessoriesStore.map(relation => relation.accessory);

        console.log("availableAccessoriesIds", availableAccessoriesIds);

        if (availableAccessoriesIds.length === 0) {
            return res.status(200).json({ status: 200, data: [] });
        }

        const accessories = await Accessory.find({ _id: { $in: availableAccessoriesIds } }).populate('category');

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

        const accessoryRelations = await BikeStoreRelation.find({ accessory: accessoryId });

        if (!accessoryRelations || accessoryRelations.length === 0) {
            return res.status(404).json({ status: 404, message: 'Accessory relations not found', data: null });
        }

        const relations = await BikeStoreRelation.find({ accessory: accessory._id }).populate('store');
        const pickupStores = relations.map(relation => relation.store);

        if (pickupStores.length === 0) {
            return res.status(404).json({ status: 404, message: 'No pickup stores found for the accessory', data: null });
        }

        const accessoriesDetails = {
            accessory,
            pickupStores,
        };

        return res.status(200).json({ status: 200, message: 'Accessory retrieved successfully', data: accessoriesDetails });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getAllAccessoriesByBikeId = async (req, res) => {
    try {
        const { bikeId } = req.params;

        const bike = await Bike.findById(bikeId);
        if (!bike) {
            return res.status(404).json({ status: 404, message: 'Bike not found', data: null });
        }

        const storeRelation = await BikeStoreRelation.findOne({ bike: bikeId });
        if (!storeRelation) {
            return res.status(404).json({ status: 404, message: 'Store relation not found for the bike', data: null });
        }

        const relatedStoreRelations = await BikeStoreRelation.find({ store: storeRelation.store, bike: storeRelation.bike });

        const accessoryIds = relatedStoreRelations.flatMap(relation => relation.accessory);

        const accessories = await Accessory.find({ _id: { $in: accessoryIds } }).populate('category');

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

exports.getStoreDetails = async (req, res) => {
    try {
        const { bikeId } = req.params;

        const bike = await Bike.findById(bikeId);
        if (!bike) {
            return res.status(404).json({ status: 404, message: 'Bike not found', data: null });
        }

        const pickupLocation = await Location.findById(bike.pickup);
        const dropOffLocation = await Location.findById(bike.drop);

        const pickupStore = await Store.find({ location: pickupLocation }).populate('location');
        const dropOffStore = await Store.findOne({ location: dropOffLocation });

        const relationPickup = await BikeStoreRelation.find({
            bike: bike._id,
            store: pickupStore,
        });

        const bikeDetails = {
            bike,
            pickupLocation,
            pickupStore,
            relationPickup,
        };

        return res.status(200).json({ status: 200, data: bikeDetails });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getStoreDetailsForAccessories1 = async (req, res) => {
    try {
        const { accessoriesId } = req.params;

        const accessories = await Accessory.findById(accessoriesId);
        if (!accessories) {
            return res.status(404).json({ status: 404, message: 'Accessory not found', data: null });
        }

        const pickupStore = await Store.find().populate('location');
        const dropOffStore = await Store.findOne();

        const accessoriesStoreLocation = pickupStore.map(store => store.location);

        const relationPickup = await BikeStoreRelation.find({
            accessory: accessories._id,
            store: pickupStore,
        });

        const accessoriesDetails = {
            accessories,
            pickupStore,
            accessoriesStoreLocation,
            relationPickup,
        };

        return res.status(200).json({ status: 200, data: accessoriesDetails });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getStoreDetailsForAccessories = async (req, res) => {
    try {
        const { accessoriesId } = req.params;

        const accessories = await Accessory.findById(accessoriesId);
        if (!accessories) {
            return res.status(404).json({ status: 404, message: 'Accessory not found', data: null });
        }

        const relations = await BikeStoreRelation.find({
            accessory: accessories._id,
        }).populate('store');

        const pickupStores = relations.map(relation => relation.store);

        if (pickupStores.length === 0) {
            return res.status(404).json({ status: 404, message: 'No pickup stores found for the accessory', data: null });
        }

        const accessoriesDetails = {
            accessories,
            pickupStores,
        };

        return res.status(200).json({ status: 200, data: accessoriesDetails });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.checkBikeAvailability1 = async (req, res) => {
    try {
        const { pickupDate, dropOffDate, pickupTime, dropOffTime } = req.query;

        const startDateTime = new Date(`${pickupDate}T${pickupTime}`);
        const endDateTime = new Date(`${dropOffDate}T${dropOffTime}`);

        console.log("startDateTime", startDateTime);
        console.log("endDateTime", endDateTime);

        const bookedBikes = await Booking.find({
            $and: [
                {
                    $or: [
                        { pickupTime: { $lte: dropOffTime }, dropOffTime: { $gte: pickupTime } },
                        { pickupTime: { $gte: pickupTime }, dropOffTime: { $lte: dropOffTime } }
                    ]
                },
                {
                    $or: [
                        { pickupDate: { $lte: dropOffDate }, dropOffDate: { $gte: pickupDate } },
                        { pickupDate: { $gte: pickupDate }, dropOffDate: { $lte: dropOffDate } }
                    ]
                },
                {
                    $or: [
                        { status: 'PENDING', isTripCompleted: false, paymentStatus: 'PENDING' },
                        { isSubscription: false },
                        {
                            isTimeExtended: true,
                            timeExtendedDropOffTime: { $gte: startDateTime, $lte: endDateTime }
                        }
                    ]
                }
            ]
        });

        console.log("bookedBikes", bookedBikes);

        const bookedBikeIds = bookedBikes.map(booking => booking.bike);

        console.log("bookedBikeIds", bookedBikeIds);

        // const bike = await Bike.find();

        // const unavailableBikeIds = await BikeStoreRelation.find({
        //     bike: { $in: bike },
        //     totalNumberOfBookedBikes: { $gt: 0 },
        // }).distinct('bike');

        // let availableBikes = {};

        // if (bookedBikeIds) {
        //     availableBikes = await Bike.find({
        //         _id: { $nin: bookedBikeIds, /*$nin: unavailableBikeIds */ },
        //         isOnTrip: false,
        //         isAvailable: true,
        //         nextAvailableDateTime: { $gte: startDateTime, $lte: endDateTime },
        //     });
        // } else if (unavailableBikeIds) {
        //     availableBikes = await Bike.find({
        //         _id: {/* $nin: bookedBikeIds, */ $nin: unavailableBikeIds },
        //         isOnTrip: false,
        //         isAvailable: true,
        //         nextAvailableDateTime: { $gte: startDateTime, $lte: endDateTime },
        //     });
        // } else {
        //     availableBikes = await Bike.find({
        //         _id: { $nin: bookedBikeIds, $nin: unavailableBikeIds },
        //         isOnTrip: false,
        //         isAvailable: true,
        //         nextAvailableDateTime: { $gte: startDateTime, $lte: endDateTime },
        //     });
        // }

        const unavailableBikeIds = await BikeStoreRelation.find({
            bike: { $in: bookedBikeIds },
            totalNumberOfBookedBikes: { $gt: 0 }
        }).distinct('bike');

        console.log("unavailableBikeIds", unavailableBikeIds);

        const availableBikes = await Bike.find({
            _id: { $nin: bookedBikeIds.concat(unavailableBikeIds) },
            isOnTrip: false,
            isAvailable: true,
            nextAvailableDateTime: { $gte: startDateTime, $lte: endDateTime }
        });

        return res.status(200).json({ status: 200, data: availableBikes });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'An error occurred while checking Bike availability' });
    }
};

exports.checkBikeAvailability = async (req, res) => {
    try {
        const { pickupDate, dropOffDate, pickupTime, dropOffTime } = req.query;

        const startDateTime = new Date(`${pickupDate}T${pickupTime}`);
        const endDateTime = new Date(`${dropOffDate}T${dropOffTime}`);

        console.log("startDateTime", startDateTime);
        console.log("endDateTime", endDateTime);

        const bikeStoreRelations = await BikeStoreRelation.find({
            bike: { $exists: true },
        }).populate('bike');

        const filteredBikeStoreRelations = bikeStoreRelations.filter(relation => {
            return relation.totalNumberOfBikes !== relation.totalNumberOfBookedBikes;
        });

        const availableBikeIds = filteredBikeStoreRelations.map(relation => relation.bike);

        if (availableBikeIds.length === 0) {
            return res.status(404).json({ status: 404, message: 'Bike is not available in any store for the specified duration' });
        }

        const bookedBikes = await Booking.find({
            bike: { $in: availableBikeIds },
            isTripCompleted: false,
            $and: [
                {
                    $or: [
                        { pickupTime: { $lte: dropOffTime }, dropOffTime: { $gte: pickupTime } },
                        { pickupTime: { $gte: pickupTime }, dropOffTime: { $lte: dropOffTime } }
                    ]
                },
                {
                    $or: [
                        { pickupDate: { $lte: dropOffDate }, dropOffDate: { $gte: pickupDate } },
                        { pickupDate: { $gte: pickupDate }, dropOffDate: { $lte: dropOffDate } }
                    ]
                },
                {
                    $or: [
                        { status: 'PENDING' },
                        { isTripCompleted: false },
                        { paymentStatus: 'PENDING' },
                        { isSubscription: false },
                        {
                            isTimeExtended: true, timeExtendedDropOffTime: { $gte: startDateTime, $lte: endDateTime }
                        }
                    ]
                }
            ]
        });

        const bookedBikeIds = bookedBikes.map(booking => booking.bike);

        const availableBikes = await Bike.find({
            _id: { $in: availableBikeIds },
            isOnTrip: false,
            isAvailable: true,
            nextAvailableDateTime: { $gte: startDateTime, $lte: endDateTime }
        });

        const bikesWithActiveSubscription = await Booking.find({
            bike: { $in: availableBikeIds },
            isTripCompleted: false,
            isSubscription: true,
            $or: [
                { $and: [{ pickupTime: { $lte: dropOffTime } }, { dropOffTime: { $gte: pickupTime } }] },
                { $and: [{ pickupTime: { $gte: pickupTime } }, { dropOffTime: { $lte: dropOffTime } }] }
            ]
        });

        const bikesWithActiveSubscriptionIds = bikesWithActiveSubscription.map(subscription => subscription.bike);

        const filteredAvailableBikes = availableBikes.filter(bike => !bikesWithActiveSubscriptionIds.includes(String(bike._id)));

        const bikeIds = filteredAvailableBikes.map(bike => bike._id);
        const bikeStoreRelationsStock = await BikeStoreRelation.find({
            bike: { $in: bikeIds },
        }).populate('bike store accessory');

        const filteredBikeStoreRelations1 = bikeStoreRelationsStock.filter(relation => {
            return relation.totalNumberOfBikes !== relation.totalNumberOfBookedBikes;
        });
        console.log("filteredBikeStoreRelations1", filteredBikeStoreRelations1);

        const bikeStoreMap = new Map();

        filteredBikeStoreRelations1.forEach(relation => {
            const { bike, store } = relation;
            if (!bikeStoreMap.has(bike._id.toString())) {
                bikeStoreMap.set(bike._id.toString(), [store]);
            } else {
                bikeStoreMap.get(bike._id.toString()).push(store);
            }
        });

        const responseData = [];

        for (const [bikeId, stores] of bikeStoreMap.entries()) {
            const bike = await Bike.findById(bikeId);
            if (bike) {
                responseData.push({ bike, stores });
            }
        }

        return res.status(200).json({ status: 200, data: responseData });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'An error occurred while checking Bike availability' });
    }
};

exports.checkBikeAvailabilityByBikeId1 = async (req, res) => {
    try {
        const { bikeId, pickupDate, dropOffDate, pickupTime, dropOffTime } = req.query;

        const startDateTime = new Date(`${pickupDate}T${pickupTime}`);
        const endDateTime = new Date(`${dropOffDate}T${dropOffTime}`);

        const bookedBike = await Booking.findOne({
            bike: bikeId,
            isTripCompleted: false,
            $and: [
                {
                    $or: [
                        { pickupTime: { $lte: dropOffTime }, dropOffTime: { $gte: pickupTime } },
                        { pickupTime: { $gte: pickupTime }, dropOffTime: { $lte: dropOffTime } }
                    ]
                },
                {
                    $or: [
                        { pickupDate: { $lte: dropOffDate }, dropOffDate: { $gte: pickupDate } },
                        { pickupDate: { $gte: pickupDate }, dropOffDate: { $lte: dropOffDate } }
                    ]
                },
                {
                    $or: [
                        { status: 'PENDING', },
                        { isTripCompleted: false, },
                        { paymentStatus: 'PENDING' },
                        { isSubscription: false },
                        {
                            isTimeExtended: true,
                            timeExtendedDropOffTime: { $gte: startDateTime, $lte: endDateTime }
                        }
                    ]
                }
            ]
        });
        console.log("bookedBike", bookedBike);

        if (bookedBike) {
            return res.status(200).json({ status: 200, message: 'Bike is not available for the specified duration' });
        } else {
            const bikeStoreRelation = await BikeStoreRelation.findOne({ bike: bikeId });
            console.log("bikeStoreRelation", bikeStoreRelation);
            if (bikeStoreRelation && bikeStoreRelation.totalNumberOfBikes === bikeStoreRelation.totalNumberOfBookedBikes) {
                return res.status(200).json({ status: 200, message: 'Bike is not available due to prior bookings' });
            } else {
                const bike = await Bike.findOne({
                    _id: bikeId,
                    isOnTrip: false,
                    isAvailable: true,
                    nextAvailableDateTime: { $gte: startDateTime, $lte: endDateTime }
                });

                if (bike) {
                    return res.status(200).json({ status: 200, message: 'Bike is available', data: bike });
                } else {
                    return res.status(200).json({ status: 200, message: 'Bike is not available' });
                }
            }
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'An error occurred while checking Bike availability by ID' });
    }
};

exports.checkBikeAvailabilityByBikeId2 = async (req, res) => {
    try {
        const { bikeId, pickupDate, dropOffDate, pickupTime, dropOffTime } = req.query;

        const startDateTime = new Date(`${pickupDate}T${pickupTime}`);
        const endDateTime = new Date(`${dropOffDate}T${dropOffTime}`);

        const bikeStoreRelation = await BikeStoreRelation.findOne({ bike: bikeId }).populate('bike store accessory');
        if (!bikeStoreRelation) {
            return res.status(404).json({ status: 404, message: 'Bike not found in the store' });
        }
        console.log("bikeStoreRelation", bikeStoreRelation);
        for (let i = 0; i < bikeStoreRelation.length; i++) {
            if (bikeStoreRelation.totalNumberOfBikes === bikeStoreRelation.totalNumberOfBookedBikes) {
                return res.status(404).json({ status: 404, message: 'Bike is out of stock' });
            }
        }

        if (bikeStoreRelation.totalNumberOfBikes >= 1) {
            const bike = await Bike.findOne({
                _id: bikeId,
                isOnTrip: false,
                isAvailable: true,
                nextAvailableDateTime: { $gte: startDateTime, $lte: endDateTime }
            });

            const bookedBike = await Booking.findOne({
                bike: bikeId,
                isTripCompleted: false,
                $and: [
                    {
                        $or: [
                            { pickupTime: { $lte: dropOffTime }, dropOffTime: { $gte: pickupTime } },
                            { pickupTime: { $gte: pickupTime }, dropOffTime: { $lte: dropOffTime } }
                        ]
                    },
                    {
                        $or: [
                            { pickupDate: { $lte: dropOffDate }, dropOffDate: { $gte: pickupDate } },
                            { pickupDate: { $gte: pickupDate }, dropOffDate: { $lte: dropOffDate } }
                        ]
                    },
                    {
                        $or: [
                            { status: 'PENDING' },
                            { isTripCompleted: false },
                            { paymentStatus: 'PENDING' },
                            { isSubscription: false },
                            {
                                isTimeExtended: true, timeExtendedDropOffTime: { $gte: startDateTime, $lte: endDateTime }
                            }
                        ]
                    }
                ]
            });

            if (bookedBike) {
                return res.status(200).json({ status: 200, message: 'Bike is not available for the specified duration' });
            }

            if (bike) {
                return res.status(200).json({ status: 200, message: 'Bike is available', data: { bike, bikeStoreRelation } });
            } else {
                return res.status(200).json({ status: 200, message: 'Bike is not available' });
            }
        } else {
            const bike = await Bike.findOne({
                _id: bikeId,
                isOnTrip: false,
                isAvailable: true,
                nextAvailableDateTime: { $gte: startDateTime, $lte: endDateTime }
            });

            if (bike) {
                return res.status(200).json({ status: 200, message: 'Bike is available', data: { bike, bikeStoreRelation } });
            } else {
                return res.status(200).json({ status: 200, message: 'Bike is not available' });
            }
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'An error occurred while checking Bike availability by ID' });
    }
};

exports.checkBikeAvailabilityByBikeId = async (req, res) => {
    try {
        const { bikeId, pickupDate, dropOffDate, pickupTime, dropOffTime } = req.query;

        const startDateTime = new Date(`${pickupDate}T${pickupTime}`);
        const endDateTime = new Date(`${dropOffDate}T${dropOffTime}`);

        const bikeStoreRelations = await BikeStoreRelation.find({ bike: bikeId }).populate('bike store accessory');

        if (!bikeStoreRelations || bikeStoreRelations.length === 0) {
            return res.status(404).json({ status: 404, message: 'Bike not found in any store' });
        }

        const bikeStoreMap = new Map();

        for (const relation of bikeStoreRelations) {
            const bikeAvailability = await Bike.findOne({
                _id: bikeId,
                isOnTrip: false,
                isAvailable: true,
                nextAvailableDateTime: { $gte: startDateTime, $lte: endDateTime }
            });

            if (relation.totalNumberOfBikes === relation.totalNumberOfBookedBikes) {
                continue;
            }

            const bookedBike = await Booking.findOne({
                bike: bikeId,
                isTripCompleted: false,
                $and: [
                    {
                        $or: [
                            { pickupTime: { $lte: dropOffTime }, dropOffTime: { $gte: pickupTime } },
                            { pickupTime: { $gte: pickupTime }, dropOffTime: { $lte: dropOffTime } }
                        ]
                    },
                    {
                        $or: [
                            { pickupDate: { $lte: dropOffDate }, dropOffDate: { $gte: pickupDate } },
                            { pickupDate: { $gte: pickupDate }, dropOffDate: { $lte: dropOffDate } }
                        ]
                    },
                    {
                        $or: [
                            { status: 'PENDING' },
                            { isTripCompleted: false },
                            { paymentStatus: 'PENDING' },
                            { isSubscription: false },
                            {
                                isTimeExtended: true, timeExtendedDropOffTime: { $gte: startDateTime, $lte: endDateTime }
                            }
                        ]
                    }
                ]
            });

            if (!bookedBike && bikeAvailability) {
                if (!bikeStoreMap.has(bikeId)) {
                    bikeStoreMap.set(bikeId, []);
                }
                bikeStoreMap.get(bikeId).push(relation);
            }
        }

        if (bikeStoreMap.size === 0) {
            return res.status(404).json({ status: 404, message: 'Bike is not available in any store for the specified duration' });
        }

        const responseData = [];

        for (const [bikeId, stores] of bikeStoreMap.entries()) {
            const bike = await Bike.findById(bikeId);
            if (bike) {
                responseData.push({ bike, stores });
            }
        }

        return res.status(200).json({ status: 200, message: 'Bike is available', data: responseData });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'An error occurred while checking Bike availability by ID' });
    }
};

exports.createBooking1 = async (req, res) => {
    try {
        const userId = req.user._id;
        const { bikeId, pickupDate, dropOffDate, pickupTime, dropOffTime } = req.body;
        const currentDate = new Date();
        const requestedPickupDate = new Date(`${pickupDate}T${pickupTime}:00.000Z`);
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
        });
        return res.status(201).json({ status: 201, message: 'Booking created successfully', data: newBooking });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.createBooking = async (req, res) => {
    try {
        const userId = req.user._id;
        let { bikeId, pickupDate, dropOffDate, pickupTime, dropOffTime, subscriptionMonths, accessoriesId, accessoriesSize } = req.body;

        const currentDate = new Date();
        const requestedPickupDate = new Date(`${pickupDate}T${pickupTime}:00.000Z`);

        if (subscriptionMonths) {
            if (!subscriptionMonths || subscriptionMonths <= 0) {
                return res.status(400).json({ status: 400, message: 'Invalid subscription duration', data: null });
            }
            const bike = await Bike.findOne({ _id: bikeId, isSubscription: true });
            if (!bike) {
                return res.status(404).json({ status: 404, message: 'Bike Not Avilable For Subscription', data: null });
            }

            dropOffDate = new Date(requestedPickupDate);
            dropOffDate.setUTCMonth(dropOffDate.getUTCMonth() + subscriptionMonths);
            dropOffDate.setUTCHours(0, 0, 0, 0);
            const dropOffDateString = dropOffDate.toISOString().split('T')[0];
            dropOffDate = dropOffDateString
            dropOffTime = pickupTime
        }
        console.log("dropOffDate", dropOffDate);

        if (requestedPickupDate < currentDate) {
            return res.status(400).json({ status: 400, message: 'Invalid pickup date. Pickup date cannot be earlier than the current date.', data: null });
        }

        const checkBikeStoreRelation = await BikeStoreRelation.find({ bike: bikeId });
        if (checkBikeStoreRelation.length === 0) {
            return res.status(400).json({ status: 400, message: 'Bike not found in any store' });
        }
        let atLeastOneStoreAvailable = false;
        let relation;
        for (relation of checkBikeStoreRelation) {
            if (relation.totalNumberOfBookedBikes < relation.totalNumberOfBikes) {
                atLeastOneStoreAvailable = true;
                break;
            }
        }

        if (!atLeastOneStoreAvailable) {
            return res.status(400).json({ status: 400, message: 'All bikes in all stores are booked' });
        }
        console.log("checkBikeStoreRelation", checkBikeStoreRelation);
        if (relation.totalNumberOfBookedBikes === relation.totalNumberOfBikes) {
            const existingBookingPickup = await Booking.findOne({
                bike: bikeId,
                pickupDate,
                pickupTime,
                dropOffDate: { $gte: pickupDate },
                isTripCompleted: false,
                isSubscription: true,
            });

            const existingBookingDrop = await Booking.findOne({
                bike: bikeId,
                pickupDate: { $lte: dropOffDate },
                dropOffDate,
                dropOffTime,
                isTripCompleted: false,
                isSubscription: true,
            });

            const existingExtendedBookingPickup = await Booking.findOne({
                bike: bikeId,
                extendedDropOffDate: pickupDate || extendedDropOffDate,
                extendedDropOffTime: pickupTime || extendedDropOffTime,
                isTripCompleted: false,
                isSubscription: true,
            });

            const existingExtendedBookingDrop = await Booking.findOne({
                bike: bikeId,
                pickupDate: { $lte: dropOffDate },
                dropOffDate,
                dropOffTime,
                isTripCompleted: false,
                isSubscription: true,
            });

            if (existingBookingPickup || existingBookingDrop || existingExtendedBookingPickup || existingExtendedBookingDrop) {
                return res.status(400).json({ status: 400, message: 'Bike is already booked for the specified pickup and/or drop-off date and time.', data: null, });
            }
        } else {

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

            const checkBikeStoreRelation = await BikeStoreRelation.find({ bike: bikeId });
            if (checkBikeStoreRelation.length === 0) {
                return res.status(400).json({ status: 400, message: 'Bike not found in any store' });
            }
            let atLeastOneStoreAvailable = false;
            let relation;
            for (relation of checkBikeStoreRelation) {
                if (relation.totalNumberOfBookedBikes < relation.totalNumberOfBikes) {
                    atLeastOneStoreAvailable = true;
                    break;
                }
            }

            if (!atLeastOneStoreAvailable) {
                return res.status(400).json({ status: 400, message: 'All bikes in all stores are booked' });
            }
            console.log("checkBikeStoreRelation", checkBikeStoreRelation);

            const isBikeAvailable = await checkBikeAvailability(bikeId, pickupDate, dropOffDate, pickupTime, dropOffTime);
            if (!isBikeAvailable) {
                return res.status(400).json({ status: 400, message: 'Bike is not available for the specified dates and times.', data: null });
            }

            let accessoriesPrice = 0;
            if (accessoriesId) {
                const accessory = await Accessory.findById(accessoriesId);
                if (accessory) {
                    const bikeStore = await BikeStoreRelation.findOne({ bike: bikeId });
                    const accessoryStore = await BikeStoreRelation.findOne({ accessory: accessoriesId });

                    if (!bikeStore || !accessoryStore || bikeStore.store.toString() !== accessoryStore.store.toString()) {
                        return res.status(400).json({ status: 400, message: 'Bike and accessory must be in the same store for booking.', data: null });
                    }

                    accessoriesPrice = accessory.price || 0;
                }

                const accessoriesSizeCheck = accessory.size;
                console.log(accessoriesSizeCheck);

                if (!accessoriesSizeCheck.includes(accessoriesSize)) {
                    return res.status(400).json({ status: 400, message: 'Accessory Size does not match.', data: null });
                }
            }

            let rentalPrice;
            if (subscriptionMonths) {
                rentalPrice = bikeExist.subscriptionAmount
            } else {
                rentalPrice = bikeExist.rentalPrice;
            }
            // const rentalPrice = bikeExist.rentalPrice;
            console.log("rentalPrice", rentalPrice);

            const durationInDays = calculateDurationInDays(pickupDate, dropOffDate, pickupTime, dropOffTime);
            console.log("durationInDays", durationInDays);
            let basePrice;
            if (subscriptionMonths) {
                basePrice = rentalPrice * subscriptionMonths;
            }
            else {
                basePrice = rentalPrice * durationInDays;
            }
            const gstPercentage = await GST.findOne({ status: false });
            if (!gstPercentage) {
                return res.status(400).json({ status: 400, message: 'GST not found.', data: null });
            }
            basePrice = basePrice + accessoriesPrice
            const taxAmount = (gstPercentage.rate / 100) * basePrice;

            const totalPrice = basePrice + taxAmount;

            console.log("totalPrice", totalPrice);

            if (isNaN(totalPrice) || totalPrice < 0) {
                return res.status(400).json({ status: 400, message: 'Invalid totalPrice', data: null });
            }

            const roundedBasePrice = Math.round(basePrice);
            const roundedTaxAmount = Math.round(taxAmount);
            const roundedTotalPrice = Math.round(totalPrice);

            const totalPriceWithAccessories = roundedTotalPrice + accessoriesPrice + bikeExist.depositMoney;

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
                totalPrice: totalPriceWithAccessories,
                depositedMoney: bikeExist.depositMoney,
                isSubscription: subscriptionMonths ? true : false,
                subscriptionMonths,
                accessories: accessoriesId,
                accessoriesSize,
                accessoriesPrice,
                gst: gstPercentage._id
            });

            const { _id: bookingId } = newBooking;
            const bikeName = bikeExist.brand + " " + bikeExist.model;
            const welcomeMessage = `Welcome, ${user.firstName + " " + user.lastName}! Thank you for Booking. Your Booking ID is ${bookingId}. You have booked ${bikeName}. Total Price: ${newBooking.totalPrice}.`;
            const welcomeNotification = new Notification({
                recipient: user._id,
                content: welcomeMessage,
                type: 'Booking',
            });
            await welcomeNotification.save();

            const bikeStoreRelation = await BikeStoreRelation.findOneAndUpdate(
                { bike: newBooking.bike, totalNumberOfBookedBikes: { $lt: relation.totalNumberOfBikes } },
                { $inc: { totalNumberOfBookedBikes: 1 } },
                { new: true }
            );

            if (!bikeStoreRelation) {
                return res.status(404).json({ status: 404, message: 'BikeStoreRelation not found', data: null });
            }

            return res.status(201).json({ status: 201, message: 'Booking created successfully', data: newBooking });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

function calculateDurationInDays(pickupDate, dropOffDate, pickupTime, dropOffTime) {
    const pickupDateTime = new Date(`${pickupDate}T${pickupTime}:00.000Z`);
    console.log("pickupDateTime", pickupDateTime);

    const dropOffDateTime = new Date(`${dropOffDate}T${dropOffTime}:00.000Z`);
    console.log("dropOffDate", dropOffDate);

    const durationInMilliseconds = dropOffDateTime - pickupDateTime;
    console.log("durationInMilliseconds", durationInMilliseconds);

    const durationInDays = durationInMilliseconds / (1000 * 60 * 60 * 24);
    console.log("durationInDays", durationInDays);

    return durationInDays;
}

async function checkBikeAvailability1(bikeId, pickupDate, dropOffDate, pickupTime, dropOffTime) {
    console.log("entry");
    const existingBookings = await Booking.find({
        bike: bikeId,
        $or: [
            {
                $and: [
                    { pickupDate: { $lte: pickupDate } },
                    { dropOffDate: { $gte: pickupDate } },
                    { pickupTime: { $lte: pickupTime } },
                    { dropOffTime: { $gte: pickupTime } },
                ],
            },
            {
                $and: [
                    { pickupDate: { $lte: dropOffDate } },
                    { dropOffDate: { $gte: dropOffDate } },
                    { pickupTime: { $lte: dropOffTime } },
                    { dropOffTime: { $gte: dropOffTime } },
                ],
            },
            // {
            //     $and: [
            //         // { isTimeExtended: true },
            //         { timeExtendedDropOffTime: { $gte: pickupDate, $lte: dropOffTime } },
            //     ],
            // },
        ],
        isTripCompleted: false,
        isSubscription: false,
    });
    console.log("exist");

    return existingBookings.length === 0;
}

async function checkBikeAvailability2(bikeId, pickupDate, dropOffDate, pickupTime, dropOffTime) {
    console.log("entry");
    const bikeStoreRelation = await BikeStoreRelation.findOne({ bike: bikeId });
    if (!bikeStoreRelation) {
        return { available: false, message: 'Bike not found in the store' };
    }

    if (bikeStoreRelation.totalNumberOfBookedBikes === bikeStoreRelation.totalNumberOfBikes) {
        return { available: false, message: 'All bikes in the store are booked' };
    }

    console.log("*****", bikeStoreRelation.totalNumberOfBookedBikes === bikeStoreRelation.totalNumberOfBikes);

    const existingBookings = await Booking.find({
        bike: bikeId,
        $or: [
            {
                $and: [
                    { pickupDate: { $lte: pickupDate } },
                    { dropOffDate: { $gte: pickupDate } },
                    { pickupTime: { $lte: pickupTime } },
                    { dropOffTime: { $gte: pickupTime } },
                ],
            },
            {
                $and: [
                    { pickupDate: { $lte: dropOffDate } },
                    { dropOffDate: { $gte: dropOffDate } },
                    { pickupTime: { $lte: dropOffTime } },
                    { dropOffTime: { $gte: dropOffTime } },
                ],
            },
        ],
        isTripCompleted: false,
        isSubscription: false,
    });

    console.log("----");
    if (bikeStoreRelation.totalNumberOfBikes >= 1) {
        if (bikeStoreRelation.totalNumberOfBookedBikes === bikeStoreRelation.totalNumberOfBikes) {
            return { available: false, message: 'All bikes in the store are booked' };
        }
        console.log("/////");
        const bike = await Bike.findOne({
            _id: bikeId,
            isOnTrip: false,
            isAvailable: true,
        });

        if (!bike) {
            return { available: false, message: 'Bike is not available' };
        }
    }

    console.log("exist");

    return existingBookings.length === 0;
}

async function checkBikeAvailability(bikeId, pickupDate, dropOffDate, pickupTime, dropOffTime) {
    const checkBikeStoreRelation = await BikeStoreRelation.find({ bike: bikeId });

    if (checkBikeStoreRelation.length === 0) {
        return { available: false, message: 'Bike not found in any store' };
    }

    let atLeastOneStoreAvailable = checkBikeStoreRelation.some(relation => relation.totalNumberOfBookedBikes < relation.totalNumberOfBikes);
    console.log('***', atLeastOneStoreAvailable);
    if (!atLeastOneStoreAvailable) {
        return { available: false, message: 'All bikes in all stores are booked' };
    }

    const existingBookings = await Booking.find({
        bike: bikeId,
        $or: [
            { pickupDate: { $lte: pickupDate }, dropOffDate: { $gte: pickupDate }, pickupTime: { $lte: pickupTime }, dropOffTime: { $gte: pickupTime } },
            { pickupDate: { $lte: dropOffDate }, dropOffDate: { $gte: dropOffDate }, pickupTime: { $lte: dropOffTime }, dropOffTime: { $gte: dropOffTime } }
        ],
        isTripCompleted: false,
        isSubscription: false
    });

    if (existingBookings.length > 0) {
        return { available: false, message: 'Bike is already booked for the selected time period' };
    }

    const bike = await Bike.findOne({
        _id: bikeId,
        isOnTrip: false,
        isAvailable: true
    });

    if (!bike) {
        return { available: false, message: 'Bike is not available' };
    }

    return { available: true, message: 'Bike is available' };
}

exports.getAllBookingsByUser = async (req, res) => {
    try {
        const userId = req.user._id;
        console.log(userId);

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
        }

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

exports.getBookingsByUser = async (req, res) => {
    try {
        const userId = req.user._id;
        console.log(userId);

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
        }

        const bookings = await Booking.find({ user: userId, status: { $in: ['PENDING', 'APPROVED'] } }).populate('bike user pickupLocation dropOffLocation');

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

exports.getBookingsById = async (req, res) => {
    try {
        const userId = req.user._id;
        const bookingId = req.params.bookingId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
        }

        const bookings = await Booking.find({ _id: bookingId, user: userId }).populate('bike user pickupLocation dropOffLocation');

        if (!bookings) {
            return res.status(404).json({ status: 404, message: 'Bookings not found', data: null });
        }

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

        if (booking.isSubscription === true) {
            booking.discountPrice = Math.round(booking.price * (coupon.discount / 100));
            booking.price = Math.round(booking.price - booking.discountPrice);
            booking.totalPrice = booking.price + booking.taxAmount + booking.depositedMoney + booking.accessoriesPrice;
        } else {
            booking.discountPrice = Math.round(booking.totalPrice * (coupon.discount / 100));
            booking.totalPrice = Math.round(booking.totalPrice - booking.discountPrice);
        }

        booking.offerCode = couponCode;
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

        if (booking.isSubscription === true) {
            booking.totalPrice = booking.price + booking.taxAmount + booking.depositedMoney + booking.accessoriesPrice + booking.discountPrice;
            booking.price = booking.price + booking.discountPrice;
        } else {
            booking.totalPrice = Math.round(booking.totalPrice + booking.discountPrice);
        }

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

exports.applyWalletToBooking = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ status: 404, message: 'Booking not found', data: null });
        }

        if (booking.isWalletUsed) {
            return res.status(400).json({ status: 400, message: 'Wallet has already been applied to this booking', data: null });
        }

        if (user.wallet <= 0) {
            return res.status(400).json({ status: 400, message: 'Insufficient wallet balance', data: null });
        }

        let walletAmountToUse;
        if (booking.isSubscription === true) {
            walletAmountToUse = Math.min(booking.price * 0.4, user.wallet);
        } else {
            walletAmountToUse = Math.min(booking.totalPrice * 0.4, user.wallet);
        }

        walletAmountToUse = Math.round(walletAmountToUse);

        if (walletAmountToUse <= 0) {
            return res.status(400).json({ status: 400, message: 'Wallet amount too low to apply', data: null });
        }

        user.wallet -= walletAmountToUse;
        await user.save();

        booking.walletAmount = walletAmountToUse;
        booking.totalPrice -= walletAmountToUse;
        booking.isWalletUsed = true;

        await booking.save();

        const welcomeMessage = `Welcome, ${user.mobileNumber}! You used your wallet balance ${walletAmountToUse}.`;
        const welcomeNotification = new Notification({
            recipient: booking.user._id,
            content: welcomeMessage,
            type: 'welcome',
        });
        await welcomeNotification.save();

        return res.status(200).json({ status: 200, message: 'Wallet applied successfully', data: booking });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.updatePaymentStatus = async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const userId = req.user._id;
        const { paymentStatus, referenceId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
        }

        const updatedBooking = await Booking.findOne({ _id: bookingId });

        if (!updatedBooking) {
            return res.status(404).json({ status: 404, message: 'Booking not found', data: null });
        }

        const validStatusValues = ['PENDING', 'FAILED', 'PAID'];
        if (!validStatusValues.includes(paymentStatus)) {
            return res.status(400).json({ error: "Invalid Payment status value" });
        }

        updatedBooking.paymentStatus = paymentStatus;
        updatedBooking.referenceId = referenceId;

        if (paymentStatus === 'PAID') {
            const bikeId = updatedBooking.bike;

            const bike = await Bike.findOne({ _id: bikeId });

            bike.rentalCount += 1;

            await bike.save();
        }

        await updatedBooking.save();
        if (paymentStatus === 'PAID') {
            const welcomeMessage = `Welcome, ${user.mobileNumber}! Thank you for Making Payment Your Payment is Paid.`;
            const welcomeNotification = new Notification({
                recipient: updatedBooking.user._id,
                content: welcomeMessage,
                type: 'welcome',
            });
            await welcomeNotification.save();
        } else {
            const welcomeMessage = `Welcome, ${user.mobileNumber}! Your Payment is Failed.`;
            const welcomeNotification = new Notification({
                recipient: updatedBooking.user._id,
                content: welcomeMessage,
                type: 'welcome',
            });
            await welcomeNotification.save();
        }

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

const getPricingInfo = async (bikeId) => {
    try {
        console.log("bike", bikeId);
        const bike = await Bike.findById(bikeId);
        if (!bike) {
            throw new Error("Bike not found");
        }

        let rentalPrice = bike.rentalExtendedPrice;

        const pricingInfo = {
            hourlyRate: rentalPrice,
            extendPrice: rentalPrice,
        };
        console.log("pricingInfo", pricingInfo);

        return pricingInfo;

    } catch (error) {
        console.error("Error getting pricing information:", error.message);
        throw error;
    }
};

function calculateDurationInDays1(extendedDropOffDate, dropOffDate, extendedDropOffTime, dropOffTime) {
    const dropOffDateTime = new Date(`${dropOffDate}T${dropOffTime}:00.000Z`);
    console.log("dropOffDateTime", dropOffDateTime);

    const parsedExtendedDropOffDate = new Date(extendedDropOffDate).toISOString().split('T')[0];

    const extendDropOffDateTimeString = `${parsedExtendedDropOffDate}T${extendedDropOffTime}:00.000Z`;

    if (isNaN(new Date(extendDropOffDateTimeString))) {
        console.error("Invalid date string:", extendDropOffDateTimeString);
        return null;
    }

    const extendDropOffDateTime = new Date(extendDropOffDateTimeString);
    console.log("extendDropOffDateTime", extendDropOffDateTime);

    const durationInMilliseconds = dropOffDateTime - extendDropOffDateTime;
    console.log("durationInMilliseconds", durationInMilliseconds);

    const durationInDays = durationInMilliseconds / (1000 * 60 * 60);
    console.log("durationInDays", durationInDays);

    return durationInDays;
}

const calculateExtendPrice = async (bookingId, extendedDropOffDate, extendedDropOffTime) => {
    try {
        const extendedBooking = await Booking.findById(bookingId);
        if (!extendedBooking) {
            throw new Error("Booking not found");
        }

        const extendDurationInDays = calculateDurationInDays1(
            extendedBooking.dropOffDate,
            extendedDropOffDate,
            extendedBooking.dropOffTime,
            extendedDropOffTime
        );
        console.log("extendDurationInDays***", extendDurationInDays);

        const pricingInfo = await getPricingInfo(extendedBooking.bike);
        let extendPrice = pricingInfo.extendPrice;
        console.log("extendPrice1***", extendPrice);

        if (extendDurationInDays <= 5) {
            extendPrice = extendPrice * extendDurationInDays;
        } else if (extendDurationInDays > 5 && extendDurationInDays <= 8) {
            extendPrice = extendPrice * 24;
        } else if (extendDurationInDays > 8) {
            extendPrice = extendPrice * 48;
        }

        // const extendPrice = pricingInfo.extendPrice /* extendDurationInDays*/;
        console.log("extendPrice2***", extendPrice);
        return extendPrice;
    } catch (error) {
        console.error("Error calculating extend price:", error.message);
        throw error;
    }
};

exports.extendBooking = async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const { extendedDropOffDate, extendedDropOffTime } = req.body;

        const extendedBooking = await Booking.findById(bookingId);
        if (!extendedBooking) {
            return res.status(404).send("Booking not found");
        }

        const extendDateTime = new Date(`${extendedDropOffDate}T${extendedDropOffTime}`);
        if (isNaN(extendDateTime.getTime())) {
            return res.status(400).json({ message: 'Invalid extended drop-off date or time' });
        }

        const pickupDate = extendedBooking.pickupDate.toISOString().split('T')[0];
        const pickupTime = extendedBooking.pickupTime;
        const pickupDateTime = new Date(`${pickupDate}T${pickupTime}`);

        if (extendDateTime <= pickupDateTime) {
            return res.status(400).json({ message: 'Extended drop-off date and time must be after the pickup date and time' });
        }

        const dropOffDate = extendedBooking.dropOffDate.toISOString().split('T')[0];
        const dropOffTime = extendedBooking.dropOffTime;
        const dropOffDateTime = new Date(`${dropOffDate}T${dropOffTime}`);

        if (extendDateTime <= dropOffDateTime) {
            return res.status(400).json({ message: 'Extended drop-off date and time must be after the drop date and time' });
        }

        const timeDifference = extendDateTime - dropOffDateTime;
        console.log("pickupDateTime", pickupDateTime);
        console.log("dropOffDateTime", dropOffDateTime);
        console.log("timeDifference", timeDifference);

        if (isNaN(timeDifference)) {
            return res.status(400).json({ message: 'Invalid time difference calculation' });
        }

        const minTimeDifference = 3600000;
        const maxTimeDifference = 2 * 24 * 3600000;
        if (timeDifference < minTimeDifference || timeDifference > maxTimeDifference) {
            return res.status(400).json({ message: 'Extended booking time must be between 1 hour or 2 days' });
        }

        const extendPrice = await calculateExtendPrice(bookingId, extendedDropOffDate, extendedDropOffTime);
        console.log("extendPrice3***", extendPrice);
        console.log("extendedBooking.totalPrice***", extendedBooking.totalPrice);

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

        extendedBooking.extendedPrice = Math.round(extendPrice);
        extendedBooking.totalExtendedPrice = Math.round(extendedBooking.totalPrice + extendPrice);

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

exports.cancelBooking1 = async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const { refundPreference, upiId } = req.body

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
        booking.refundPreference = refundPreference;
        booking.upiId = upiId;
        await booking.save();

        return res.status(200).json({ status: 200, message: 'Booking cancelled successfully', data: booking });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
        }

        const bookingId = req.params.bookingId;
        const { refundPreference, upiId, accountNo, branchName, ifscCode } = req.body;

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

        const refundCharges = await RefundCharge.findOne();
        const refundAmount = booking.totalPrice
        const newRefund = new Refund({
            booking: booking._id,
            refundAmount: refundAmount,
            refundCharges: refundCharges.refundAmount || 0,
            totalRefundAmount: refundAmount - refundCharges.refundAmount,
            type: refundPreference,
            refundStatus: 'PENDING',
            refundDetails: refundPreference,
            upiId: upiId || null,
            accountNo: accountNo || null,
            branchName: branchName || null,
            ifscCode: ifscCode || null,
            refundTransactionId: '',
        });


        const savedRefund = await newRefund.save();
        console.log("booking.totalPrice", booking.totalPrice);
        booking.status = 'CANCELLED';
        booking.refundPreference = refundPreference;
        booking.upiId = upiId;
        booking.accountNo = accountNo;
        booking.branchName = branchName;
        booking.ifscCode = ifscCode;
        booking.refund = savedRefund._id;
        await booking.save();
        const welcomeMessage = `Welcome, ${user.mobileNumber}! Your Booking is Cancel and your refund payment is initiated.`;
        const welcomeNotification = new Notification({
            recipient: booking.user._id,
            content: welcomeMessage,
            type: 'welcome',
        });
        await welcomeNotification.save();

        const bikeStoreRelation = await BikeStoreRelation.findOneAndUpdate(
            { bike: booking.bike },
            { $inc: { totalNumberOfBookedBikes: -1 } },
            { new: true }
        );

        if (!bikeStoreRelation) {
            return res.status(404).json({ status: 404, message: 'BikeStoreRelation not found', data: null });
        }

        if (booking.status === "CANCELLED") {
            if (booking.paymentStatus === 'PAID') {
                let line_items = [];
                let name, obj2;
                if (booking.bike != (null || undefined)) {
                    let findBike = await Bike.findOne({ _id: booking.bike });
                    if (findBike) {
                        name = findBike.brand;
                        obj2 = {
                            BikeNmae: name,
                            BikeModel: findBike.model,
                            AboutBike: findBike.aboutBike,
                            BIkeNo: findBike.bikeNumber,
                            BikeType: findBike.type,
                            PickupDate: booking.pickupDate,
                            DropOffDate: booking.dropOffDate,
                            PickupTime: booking.pickupTime,
                            DropOffTime: booking.dropOffTime,
                            status: booking.status,
                            paymentStatus: booking.paymentStatus,
                            depositedMoney: booking.depositedMoney,
                            tax: booking.taxAmount,
                            paidAmount: booking.price,
                            total: booking.totalPrice,
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
                        PickupDate: booking.pickupDate,
                        DropOffDate: booking.dropOffDate,
                        PickupTime: booking.pickupTime,
                        DropOffTime: booking.dropOffTime,
                        status: booking.status,
                        paymentStatus: booking.paymentStatus,
                        depositedMoney: booking.depositedMoney,
                        tax: booking.taxAmount,
                        paidAmount: booking.price,
                        total: booking.totalPrice,
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
                    ["Booking: Cancled", "", "", "", "", "Invoice No: ", `${booking._id}`],
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
                    ["ALKASWA RENTAL", "PRIVATE LIMITED", "", "", "", `INR${booking?.taxAmount}`, "", `INR${booking?.totalPrice}`],
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

                booking.pdfLink = cloudinaryUploadResponse.secure_url;
                await booking.save();
                console.log("booking.pdfLink", booking.pdfLink);

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
                        text: `Booking has been Cancelled ${booking._id}`,
                    };
                    let info1 = await transporter.sendMail(mailOptions1);
                }
            }
        }

        return res.status(200).json({ status: 200, message: 'Booking cancelled successfully', data: booking });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getRefundStatusAndAmount = async (req, res) => {
    try {
        const bookingId = req.params.bookingId;

        const booking = await Booking.findOne({ _id: bookingId });

        if (!booking) {
            return res.status(404).json({ status: 404, message: 'Booking not found', data: null });
        }

        const refund = await Refund.findOne({ booking: bookingId })
            .populate({
                path: 'booking',
                populate: {
                    path: 'bike user pickupLocation dropOffLocation',
                },
            });
        if (!refund) {
            return res.status(404).json({ status: 404, message: 'Refund not found', data: null });
        }

        const response = {
            status: 200,
            message: 'Refund status and amount retrieved successfully',
            data: refund,
        };

        return res.status(200).json(response);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 500,
            message: 'Server error while retrieving refund status and amount',
            data: null,
        });
    }
};

exports.getCancelBookingsByUser = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
        }

        const bookings = await Booking.find({ user: userId, status: "CANCELLED" }).populate('bike user pickupLocation dropOffLocation');

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

        return res.status(200).json({ status: 200, message: 'Canceled Bookings retrieved successfully', data: bookings });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getCompletedBookingsByUser = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
        }

        const bookings = await Booking.find({ user: userId, status: "COMPLETED" }).populate('bike user pickupLocation dropOffLocation');

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

        return res.status(200).json({ status: 200, message: 'Completed Bookings retrieved successfully', data: bookings });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getUpcomingBookingsByUser = async (req, res) => {
    try {
        const userId = req.user._id;
        console.log(userId);

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
        }

        const bookings = await Booking.find({ user: userId, status: { $in: ['PENDING', 'APPROVED'] }, pickupDate: { $gte: new Date() } }).populate('bike user pickupLocation dropOffLocation');
        console.log(bookings);
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

exports.getInquiries = async (req, res) => {
    try {
        const inquiries = await HelpAndSupport.find().sort({ createdAt: -1 });

        return res.status(200).json({
            status: 200,
            message: 'Inquiries retrieved successfully',
            data: inquiries,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getInquiryById = async (req, res) => {
    try {
        const { inquiryId } = req.params;

        const inquiry = await HelpAndSupport.findById(inquiryId);

        if (!inquiry) {
            return res.status(404).json({
                status: 404,
                message: 'Inquiry not found',
                data: null,
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'Inquiry retrieved successfully',
            data: inquiry,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.replyToInquiry = async (req, res) => {
    try {
        const { inquiryId } = req.params;
        const { message } = req.body;

        const inquiry = await HelpAndSupport.findByIdAndUpdate(
            inquiryId,
            { $push: { messages: { message, user: req.user._id } } },
            { new: true }
        );

        if (!inquiry) {
            return res.status(404).json({
                status: 404,
                message: 'Inquiry not found',
                data: null,
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'Reply added successfully',
            data: inquiry,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
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

exports.getNotificationsForUser = async (req, res) => {
    try {
        const userId = req.params.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const notifications = await Notification.find({ recipient: userId });

        return res.status(200).json({ status: 200, message: 'Notifications retrieved successfully', data: notifications });
    } catch (error) {
        return res.status(500).json({ status: 500, message: 'Error retrieving notifications', error: error.message });
    }
};

exports.getAllNotificationsForUser = async (req, res) => {
    try {
        const userId = req.user._id;

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

exports.getAllTermAndCondition = async (req, res) => {
    try {
        const termAndCondition = await TermAndCondition.find();

        if (!termAndCondition) {
            return res.status(404).json({ status: 404, message: 'Terms and Conditions not found' });
        }

        return res.status(200).json({ status: 200, message: "Sucessfully", data: termAndCondition });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', details: error.message });
    }
};

exports.getTermAndConditionById = async (req, res) => {
    try {
        const termAndConditionId = req.params.id;
        const termAndCondition = await TermAndCondition.findById(termAndConditionId);

        if (!termAndCondition) {
            return res.status(404).json({ status: 404, message: 'Terms and Conditions not found' });
        }

        return res.status(200).json({ status: 200, message: 'Sucessfully', data: termAndCondition });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', details: error.message });
    }
};

exports.getAllCancelationPolicy = async (req, res) => {
    try {
        const cancelationPolicy = await CancelationPolicy.find();

        if (!cancelationPolicy) {
            return res.status(404).json({ status: 404, message: 'Cancelation and Policy not found' });
        }

        return res.status(200).json({ status: 200, message: "Sucessfully", data: cancelationPolicy });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', details: error.message });
    }
};

exports.getCancelationPolicyById = async (req, res) => {
    try {
        const cancelationPolicyId = req.params.id;
        const cancelationPolicy = await CancelationPolicy.findById(cancelationPolicyId);

        if (!cancelationPolicy) {
            return res.status(404).json({ status: 404, message: 'Cancelation and Policy not found' });
        }

        return res.status(200).json({ status: 200, message: 'Sucessfully', data: cancelationPolicy });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', details: error.message });
    }
};

exports.createBussinesInquary = async (req, res) => {
    try {
        const { subjectId, message } = req.body;

        const newInquiry = await BussinesInquary.create({
            subjectId,
            messages: [{ message, user: req.user._id }],
            status: "NEW"
        });

        return res.status(201).json({
            status: 201,
            message: 'Bussines Inquary created successfully',
            data: newInquiry,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getBussinesInquary = async (req, res) => {
    try {
        const inquiries = await BussinesInquary.find({ "messages.user": req.user._id }).sort({ createdAt: -1 }).populate('messages.user', 'subjectId');

        return res.status(200).json({
            status: 200,
            message: 'Bussines Inquary retrieved successfully',
            data: inquiries,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getBussinesInquaryById = async (req, res) => {
    try {
        const { bussinesInquaryId } = req.params;

        const inquiry = await BussinesInquary.findById(bussinesInquaryId).populate('messages.user', 'subjectId');

        if (!inquiry) {
            return res.status(404).json({
                status: 404,
                message: 'Bussines Inquary not found',
                data: null,
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'Bussines Inquary retrieved successfully',
            data: inquiry,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.updateBussinesInquary = async (req, res) => {
    try {
        const { bussinesInquaryId } = req.params;
        const { subjectId, message } = req.body;

        const updatedInquiry = await BussinesInquary.findByIdAndUpdate(
            bussinesInquaryId,
            { subjectId, messages: { message, user: req.user._id } },
            { new: true }
        );

        if (!updatedInquiry) {
            return res.status(404).json({
                status: 404,
                message: 'Bussines Inquary not found',
                data: null,
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'Bussines Inquary updated successfully',
            data: updatedInquiry,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.deleteBussinesInquary = async (req, res) => {
    try {
        const { bussinesInquaryId } = req.params;

        const deletedInquiry = await BussinesInquary.findByIdAndDelete(bussinesInquaryId);

        if (!deletedInquiry) {
            return res.status(404).json({
                status: 404,
                message: 'Bussines Inquary not found',
                data: null,
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'Bussines Inquary deleted successfully',
            data: deletedInquiry,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.createStory = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { name, text, status } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        let images = [];
        if (req.files) {
            for (let j = 0; j < req.files.length; j++) {
                let obj = {
                    img: req.files[j].path,
                };
                images.push(obj);
            }
        }

        const newStory = await Story.create({
            user: userId,
            name,
            images,
            text,
            status,
        });

        return res.status(201).json({
            status: 201,
            message: 'Story created successfully',
            data: newStory,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getAllStories = async (req, res) => {
    try {
        const stories = await Story.find({
            isAdminApproved: true
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            status: 200,
            message: 'Stories retrieved successfully',
            data: stories,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getStoryById = async (req, res) => {
    try {
        const { storyId } = req.params;

        const story = await Story.findById({ _id: storyId, isAdminApproved: true });

        if (!story) {
            return res.status(404).json({
                status: 404,
                message: 'Story not found',
                data: null,
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'Story retrieved successfully',
            data: story,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.createOrder1 = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
        }

        const { items, shippingAddress, paymentMethod } = req.body;

        const address = await Address.findById({ _id: shippingAddress, user: userId });
        if (!address) {
            return res.status(404).json({ status: 404, message: 'Address not found for this User', data: null });
        }

        let totalPrice = 0;
        for (const item of items) {
            const accessory = await Accessory.findById(item.accessory);
            if (!accessory) {
                return res.status(404).json({ status: 404, message: `Accessory not found for ID: ${item.accessory}`, data: null });
            }
            item.price = accessory.price || 0;
            totalPrice += item.price * item.quantity;
        }

        const newOrder = await Order.create({
            user: user._id,
            items,
            totalPrice,
            shippingAddress,
            paymentMethod,
        });

        return res.status(201).json({
            status: 201,
            message: 'Order created successfully',
            data: newOrder,
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

exports.createOrder = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
        }

        const { items, shippingAddress, storeId, paymentMethod } = req.body;

        if (storeId) {
            const storeRelation = await BikeStoreRelation.find({ store: storeId });
            if (!storeRelation || storeRelation.length === 0) {
                return res.status(404).json({
                    status: 404,
                    message: 'Store relation not found for this Store',
                    data: null,
                });
            }

            let totalPrice = 0;
            for (const item of items) {
                const accessory = await Accessory.findById(item.accessory);

                const accessoryInStore = storeRelation.find(
                    relation => relation.accessory.equals(item.accessory)
                );

                if (!accessory || !accessoryInStore) {
                    return res.status(404).json({
                        status: 404,
                        message: `Accessory not found or not related to the specified store for ID: ${item.accessory}`,
                        data: null,
                    });
                }

                if (!accessoryInStore || accessoryInStore.totalNumberOfBookedAccessory >= accessoryInStore.totalNumberOfAccessory) {
                    return res.status(400).json({
                        status: 400,
                        message: `Product ${item.accessory} is currently out of stock`,
                        data: null,
                    });
                }

                item.price = accessory.price || 0;
                totalPrice += item.price * item.quantity;
            }

            const newOrder = await Order.create({
                user: userId,
                items,
                totalPrice,
                storeId,
                paymentMethod,
            });

            const accessoryIds = newOrder.items.map(item => item.accessory);

            const welcomeMessage = `Welcome, ${user.mobileNumber}! Thank you for Order your order amount is ${newOrder.totalPrice} and your payment method ${newOrder.paymentMethod}`;
            const welcomeNotification = new Notification({
                recipient: newOrder.user._id,
                content: welcomeMessage,
                type: 'welcome',
            });
            await welcomeNotification.save();

            for (const item of newOrder.items) {
                const accessoryStoreRelation = await BikeStoreRelation.findOneAndUpdate(
                    { accessory: item.accessory },
                    { $inc: { totalNumberOfBookedAccessory: 1 } },
                    { new: true }
                );

                if (!accessoryStoreRelation) {
                    return res.status(404).json({ status: 404, message: 'Accessory store relation not found', data: null });
                }
            }

            return res.status(201).json({
                status: 201,
                message: 'Order created successfully',
                data: newOrder,
            });
        } else {
            const address = await Address.findById({ _id: shippingAddress, user: userId });
            if (!address) {
                return res.status(404).json({
                    status: 404,
                    message: 'Address not found for this User',
                    data: null,
                });
            }

            let totalPrice = 0;
            for (const item of items) {
                const accessory = await Accessory.findById(item.accessory);
                if (!accessory) {
                    return res.status(404).json({
                        status: 404,
                        message: `Accessory not found for ID: ${item.accessory}`,
                        data: null,
                    });
                }
                item.price = accessory.price || 0;
                totalPrice += item.price * item.quantity;
            }

            const newOrder = await Order.create({
                user: userId,
                items,
                totalPrice,
                shippingAddress,
                paymentMethod,
            });

            const welcomeMessage = `Welcome, ${user.mobileNumber}! Thank you for Order your order amount is ${newOrder.totalPrice} and your payment method ${newOrder.paymentMethod}`;
            const welcomeNotification = new Notification({
                recipient: newOrder.user._id,
                content: welcomeMessage,
                type: 'welcome',
            });
            await welcomeNotification.save();

            for (const item of newOrder.items) {
                const accessoryStoreRelation = await BikeStoreRelation.findOneAndUpdate(
                    { accessory: item.accessory },
                    { $inc: { totalNumberOfBookedAccessory: 1 } },
                    { new: true }
                );

                if (!accessoryStoreRelation) {
                    return res.status(404).json({ status: 404, message: 'Accessory store relation not found', data: null });
                }
            }

            return res.status(201).json({
                status: 201,
                message: 'Order created successfully',
                data: newOrder,
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 500,
            message: 'Server error',
            data: null,
        });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
        }

        const orders = await Order.find({ user: userId }).populate('user').populate('items.accessory').populate('shippingAddress').populate('storeId');

        return res.status(200).json({
            status: 200,
            message: 'Orders retrieved successfully',
            data: orders,
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

exports.getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId).populate('user').populate('items.accessory').populate('shippingAddress').populate('storeId');

        if (!order) {
            return res.status(404).json({
                status: 404,
                message: 'Order not found',
                data: null,
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'Order retrieved successfully',
            data: order,
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

exports.updateOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { paymentStatus } = req.body;

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { paymentStatus },
            { new: true }
        ).populate('user').populate('items.accessory').populate('shippingAddress');

        if (!updatedOrder) {
            return res.status(404).json({
                status: 404,
                message: 'Order not found',
                data: null,
            });
        }

        for (const item of updatedOrder.items) {
            if (item.accessory) {
                await Accessory.findByIdAndUpdate(item.accessory._id, { $inc: { stock: -1 } });
            }
        }

        const welcomeMessage = `Welcome, ${updatedOrder.user.mobileNumber}! Thank you for your order. The amount is ${updatedOrder.totalPrice} and your payment method is ${updatedOrder.paymentMethod}.`;
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

exports.getAllSubjectsCategories = async (req, res) => {
    try {
        const categories = await SubjectsCategory.find();

        return res.status(200).json({
            status: 200,
            message: 'Subjects categories retrieved successfully',
            data: categories,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getSubjectsCategoryById = async (req, res) => {
    try {
        const subjectId = req.params.subjectId;
        const category = await SubjectsCategory.findById(subjectId);

        if (!category) {
            return res.status(404).json({ status: 404, message: 'Subjects Category not found', data: null });
        }

        return res.status(200).json({ status: 200, message: 'Subjects Category retrieved successfully', data: category });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.overAllSearch = async (req, res) => {
    try {
        const query = req.query.search;
        const BikeResults = await Bike.find({ $or: [{ brand: { $regex: query, $options: 'i' } }, { model: { $regex: query, $options: 'i' } }] });
        const AccessoryResults = await Accessory.find({ name: { $regex: query, $options: 'i' } });
        const StoreResults = await Store.find({ name: { $regex: query, $options: 'i' } });
        const combinedResults = [...BikeResults, ...AccessoryResults, ...StoreResults];
        const uniqueResults = Array.from(new Set(combinedResults.map(result => result.name)))
            .map(name => combinedResults.find(result => result.name === name));
        const response = {
            Bikes: uniqueResults.filter(result => result instanceof Bike).map(result => ({
                type: 'Bike',
                data: result,
            })),
            Accessory: uniqueResults.filter(result => result instanceof Accessory).map(result => ({
                type: 'Accessory',
                data: result,
            })),
            Store: uniqueResults.filter(result => result instanceof Store).map(result => ({
                type: 'Store',
                data: result,
            })),
        };
        return res.status(200).json({ message: "Search result.", status: 200, data: response });
    } catch (error) {
        console.error(error);
        return res.status(501).send({ status: 501, message: "Server error.", data: {} });
    }
}

exports.filterSearch = async (req, res) => {
    try {
        const { minPrice, maxPrice, sortBy, premiumBike } = req.query;

        let filter = {};

        if (minPrice && maxPrice) {
            filter.rentalPrice = { $gte: minPrice, $lte: maxPrice };
        }

        if (premiumBike) {
            filter.isPremium = premiumBike === 'true';
        }

        const bookings = await Booking.find({ bike: { $exists: true } });

        const bikeRatings = {};
        bookings.forEach(booking => {
            if (booking.rating) {
                const bikeIdString = booking.bike.toString();
                if (!bikeRatings[bikeIdString]) {
                    bikeRatings[bikeIdString] = [];
                }
                bikeRatings[bikeIdString].push(booking.rating);
            }
        });

        const bikeAverageRatings = {};
        for (const bikeId in bikeRatings) {
            const ratings = bikeRatings[bikeId];
            const averageRating = ratings.reduce((total, rating) => total + rating, 0) / ratings.length;
            bikeAverageRatings[bikeId] = averageRating;
        }

        let filteredBikes = await Bike.find(filter);

        for (let i = 0; i < filteredBikes.length; i++) {
            const bike = filteredBikes[i];
            const bookingCount = await Booking.countDocuments({ bike: bike._id });
            bike.bookingCount = bookingCount;
        }

        filteredBikes.forEach(bike => {
            bike.averageRating = bikeAverageRatings[bike._id.toString()] || 0;
        });

        if (sortBy === 'topBooked') {
            filteredBikes.sort((a, b) => b.bookingCount - a.bookingCount);
        } else if (sortBy === 'priceLowToHigh') {
            filteredBikes.sort((a, b) => a.rentalPrice - b.rentalPrice);
        } else if (sortBy === 'priceHighToLow') {
            filteredBikes.sort((a, b) => b.rentalPrice - a.rentalPrice);
        } else if (sortBy === 'topRated') {
            filteredBikes.sort((a, b) => b.averageRating - a.averageRating);
        }

        return res.status(200).json({
            status: 200,
            message: 'Filtered search results',
            data: filteredBikes
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 500,
            message: 'Server error while filtering search results',
            data: null
        });
    }
};

exports.topPickedBikes = async (req, res) => {
    try {
        const topPicks = await Booking.aggregate([
            { $group: { _id: '$bike', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 15 }
        ]);

        const bikeIds = topPicks.map(item => item._id);

        const topPickedBikes = await Bike.find({ _id: { $in: bikeIds } });

        return res.status(200).json({ status: 200, message: 'Top picked bikes retrieved successfully', data: topPickedBikes });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getAllGST = async (req, res) => {
    try {
        const gstEntries = await GST.find();
        return res.status(200).json({ status: 200, data: gstEntries });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getGSTById = async (req, res) => {
    try {
        const gstEntry = await GST.findById(req.params.id);
        if (!gstEntry) {
            return res.status(404).json({ status: 404, message: 'GST entry not found', data: null });
        }
        return res.status(200).json({ status: 200, data: gstEntry });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.addReviewForBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { rating, userReview } = req.body;
        const userId = req.user._id;
        console.log(userId);
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ status: 400, message: 'Invalid rating. Rating must be between 1 and 5.' });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ status: 404, message: 'Booking not found' });
        }

        booking.review.push({ userReview });
        await booking.save();

        if (rating) {
            booking.rating = rating
            await booking.save();
        }

        return res.status(201).json({ status: 201, message: 'Review added successfully', data: booking });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error' });
    }
};

exports.getReviewsForBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
        }

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ status: 404, message: 'Booking not found' });
        }

        return res.status(200).json({ status: 200, data: booking });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error' });
    }
};

exports.getAllReviewsForBooking = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
        }

        const bookings = await Booking.find({ user: userId });

        const reviews = [];
        bookings.forEach(booking => {
            booking.review.forEach(review => {
                reviews.push({
                    bookingId: booking._id,
                    rating: booking.rating,
                    userReview: review.userReview
                });
            });
        });

        return res.status(200).json({ status: 200, message: 'User reviews retrieved successfully', data: reviews });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Internal server error' });
    }
};

exports.createUserDetails = async (req, res) => {
    try {
        const { upiId, accountNumber, ifscCode, branchName } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
        }

        const userDetails = new UserDetails({
            userId,
            upiId,
            accountNumber,
            ifscCode,
            branchName
        });

        await userDetails.save();

        return res.status(201).json({ status: 201, message: 'User details created successfully', data: userDetails });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error while creating user details', data: null });
    }
};

exports.getUserDetails = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
        }

        const userDetails = await UserDetails.find({ userId });

        if (!userDetails) {
            return res.status(404).json({ status: 404, message: 'User details not found', data: null });
        }

        return res.status(200).json({ status: 200, message: 'User details retrieved successfully', data: userDetails });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error while retrieving user details', data: null });
    }
};

exports.getUserDetailsById = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
        }

        const userDetails = await UserDetails.findOne({ _id: req.params.id });

        if (!userDetails) {
            return res.status(404).json({ status: 404, message: 'User details not found', data: null });
        }

        return res.status(200).json({ status: 200, message: 'User details retrieved successfully', data: userDetails });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error while retrieving user details', data: null });
    }
};

exports.updateUserDetails = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
        } const updateFields = req.body;

        const userDetails = await UserDetails.findOneAndUpdate({ _id: req.params.id }, updateFields, { new: true });

        if (!userDetails) {
            return res.status(404).json({ status: 404, message: 'User details not found', data: null });
        }

        return res.status(200).json({ status: 200, message: 'User details updated successfully', data: userDetails });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error while updating user details', data: null });
    }
};

exports.deleteUserDetails = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
        }

        const userDetails = await UserDetails.findOneAndDelete({ userId });

        if (!userDetails) {
            return res.status(404).json({ status: 404, message: 'User details not found', data: null });
        }

        return res.status(200).json({ status: 200, message: 'User details deleted successfully', data: null });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error while deleting user details', data: null });
    }
};


