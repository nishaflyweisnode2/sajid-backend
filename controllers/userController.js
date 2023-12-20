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
const Story = require('../models/sotriesModel');
const Order = require('../models/orderModel');
const RefundCharge = require('../models/refundChargeModel');
const Refund = require('../models/refundModel');




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

exports.getStoreDetailsForAccessories = async (req, res) => {
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
                        { 'status': 'PENDING', 'isTripCompleted': false },
                        { 'isSubscription': false },
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
        let { bikeId, pickupDate, dropOffDate, pickupTime, dropOffTime, subscriptionMonths, accessoriesId } = req.body;

        const currentDate = new Date();
        const requestedPickupDate = new Date(`${pickupDate}T${pickupTime}:00.000Z`);

        if (subscriptionMonths) {
            if (!subscriptionMonths || subscriptionMonths <= 0) {
                return res.status(400).json({ status: 400, message: 'Invalid subscription duration', data: null });
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
            }

            const rentalPrice = bikeExist.rentalPrice;
            console.log("rentalPrice", rentalPrice);

            const durationInDays = calculateDurationInDays(pickupDate, dropOffDate, pickupTime, dropOffTime);
            console.log("durationInDays", durationInDays);

            let basePrice = rentalPrice * durationInDays;
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
                accessoriesPrice,
                gst: gstPercentage._id
            });

            const welcomeMessage = `Welcome, ${user.userName}! Thank you for Booking, your Booking details ${newBooking}.`;
            const welcomeNotification = new Notification({
                recipient: user._id,
                content: welcomeMessage,
                type: 'Booking',
            });
            await welcomeNotification.save();


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

async function checkBikeAvailability(bikeId, pickupDate, dropOffDate, pickupTime, dropOffTime) {
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

    return existingBookings.length === 0;
}

exports.getBookingsByUser = async (req, res) => {
    try {
        const userId = req.user._id;

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
        const { paymentStatus, referenceId } = req.body;

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
        const bookingId = req.params.bookingId;
        const { refundPreference, upiId } = req.body;

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
            refundStatus: 'PENDING',
            refundDetails: refundPreference,
            userPaymentDetails: upiId,
            refundTransactionId: '',
        });


        const savedRefund = await newRefund.save();
        console.log("booking.totalPrice", booking.totalPrice);
        booking.status = 'CANCELLED';
        booking.refundPreference = refundPreference;
        booking.upiId = upiId;
        booking.refund = savedRefund._id;
        await booking.save();

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

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found', data: null });
        }

        const bookings = await Booking.find({ user: userId, pickupDate: { $gte: new Date() } }).populate('bike user pickupLocation dropOffLocation');

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
        const { name, text, status } = req.body;

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

exports.createOrder = async (req, res) => {
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
            if (!storeRelation) {
                return res.status(404).json({
                    status: 404,
                    message: 'Store relation not found for this User and Store',
                    data: null,
                });
            }
            console.log("storeRelation", storeRelation);

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

                item.price = accessory.price || 0;
                totalPrice += item.price * item.quantity;
            }

            const newOrder = await Order.create({
                user: user._id,
                items,
                totalPrice,
                storeId,
                paymentMethod,
            });

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





