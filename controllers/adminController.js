const User = require('../models/userModel');
const authConfig = require("../configs/auth.config");
const jwt = require("jsonwebtoken");
const newOTP = require("otp-generators");
const bcrypt = require("bcryptjs");
const City = require('../models/cityModel');
const Bike = require('../models/bikeModel');
const Location = require("../models/bikeLocationModel");
const Store = require('../models/storeModel');
const BikeStoreRelation = require('../models/BikeStoreRelationModel');
const Coupon = require('../models/couponModel');
const Booking = require('../models/bookingModel');
const AccessoryCategory = require('../models/accessory/accessoryCategoryModel')
const Accessory = require('../models/accessory/accessoryModel')
const GST = require('../models/gstModel');
const HelpAndSupport = require('../models/help&SupportModel');
const Notification = require('../models/notificationModel');
const TermAndCondition = require('../models/term&conditionModel');
const CancelationPolicy = require('../models/cancelationPolicyModel');
const SubjectsCategory = require('../models/subjectModel');
const BussinesInquary = require('../models/bussinesInquaryModel');
const Story = require('../models/storyModel');
const Order = require('../models/orderModel')
const RefundCharge = require('../models/refundChargeModel');
const Refund = require('../models/refundModel');
const QRCode = require('qrcode');
const firebase = require('../middlewares/firebase');
const Commission = require('../models/commisionModel');




exports.registration = async (req, res) => {
    const { phone, email } = req.body;
    try {
        req.body.email = email.split(" ").join("").toLowerCase();
        let user = await User.findOne({ $and: [{ $or: [{ email: req.body.email }, { phone: phone }] }], userType: "ADMIN" });
        if (!user) {
            req.body.password = bcrypt.hashSync(req.body.password, 8);
            req.body.userType = "ADMIN";
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
        const user = await User.findOne({ email: email, userType: "ADMIN" });
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
        const { firstName, lastName, email, mobileNumber, password, confirmPassword } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).send({ message: "not found" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ status: 400, message: 'Passwords do not match' });
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

exports.uploadIdPicture = async (req, res) => {
    try {
        const userId = req.params.id;

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
        const userId = req.params.id;

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

exports.uploadProfilePicture = async (req, res) => {
    try {
        const userId = req.params.id;

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

exports.createCity = async (req, res) => {
    try {
        const { name, status } = req.body;

        if (!req.file) {
            return res.status(400).json({ status: 400, error: "Image file is required" });
        }

        const existingCity = await City.findOne({ name });

        if (existingCity) {
            return res.status(400).json({
                status: 400,
                message: 'City with the same name already exists',
            });
        }

        const newCity = new City({ name, image: req.file.path, status });

        const savedCity = await newCity.save();

        res.status(201).json({
            status: 201,
            message: 'City created successfully',
            data: savedCity,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
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

exports.updateCityById = async (req, res) => {
    try {
        const { name, status } = req.body;
        const cityId = req.params.id;

        const existingCity = await City.findById(cityId);

        if (!existingCity) {
            return res.status(404).json({
                status: 404,
                message: 'City not found',
            });
        }

        if (name && name !== existingCity.name) {
            const duplicateCity = await City.findOne({ name });

            if (duplicateCity) {
                return res.status(400).json({
                    status: 400,
                    message: 'City with the updated name already exists',
                });
            }

            existingCity.name = name;
        }

        if (req.file) {
            existingCity.image = req.file.path;
        }

        if (req.body.status !== undefined) {
            existingCity.status = status;
        }

        const updatedCity = await existingCity.save();

        res.status(200).json({
            status: 200,
            message: 'City updated successfully',
            data: updatedCity,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, error: 'Server error' });
    }
};

exports.deleteCityById = async (req, res) => {
    try {
        const deletedCity = await City.findByIdAndDelete(req.params.id);

        if (!deletedCity) {
            return res.status(404).json({ message: 'City not found' });
        }

        res.status(200).json({
            status: 200,
            message: 'City deleted successfully',
            data: deletedCity,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllUser = async (req, res) => {
    try {
        const users = await User.find().populate('city');
        if (!users || users.length === 0) {
            return res.status(404).json({ status: 404, message: 'Users not found' });
        }

        const formattedUsers = users.map(user => ({
            _id: user._id,
            user: user,
            memberSince: user.createdAt.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric',
            }),
        }));

        return res.status(200).json({
            status: 200,
            data: formattedUsers,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.getAllUserByType = async (req, res) => {
    try {
        const { userType } = req.params;

        const users = await User.find({ userType: userType }).populate('city');
        if (!users || users.length === 0) {
            return res.status(404).json({ status: 404, message: 'Users not found' });
        }

        const formattedUsers = users.map(user => ({
            _id: user._id,
            user: user,
            memberSince: user.createdAt.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric',
            }),
        }));

        return res.status(200).json({
            status: 200,
            data: formattedUsers,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.updateUserDetails = async (req, res) => {
    try {
        const { firstName, lastName, email, mobileNumber, password, confirmPassword, status } = req.body;
        const userId = req.params.id;

        if (password !== confirmPassword) {
            return res.status(400).json({ status: 400, message: 'Passwords do not match' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.email = email || user.email;
        user.status = status || user.status;
        user.mobileNumber = mobileNumber || user.mobileNumber;
        if (password) {
            user.password = bcrypt.hashSync(password, 8);
        }

        const updatedUser = await user.save();

        return res.status(200).json({ message: 'User details updated successfully', data: updatedUser });
    } catch (err) {
        console.error('Error updating user details:', err);
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const { userId } = req.params;

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

exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        await User.findByIdAndDelete(userId);

        return res.status(200).json({ status: 200, message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.getPendingVerificationUsers = async (req, res) => {
    try {
        const pendingVerificationUsers = await User.find({ isVerified: false });

        return res.status(200).json({
            status: 200,
            data: pendingVerificationUsers,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.updateVerificationStatus = async (req, res) => {
    try {
        const userId = req.params.id;
        const { isVerified, remarks } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        user.isVerified = isVerified;
        user.remarks = remarks;

        if (isVerified === false) {
            user.isRejectUser = true;
        } else if (isVerified === true) {
            user.isRejectUser = false;
        }

        await user.save();

        const welcomeMessage = `Welcome, ${user.firstName}! Your Account Is Verifed By Admin Now You Can Book Your First Ride.`;
        const welcomeNotification = new Notification({
            recipient: user._id,
            content: welcomeMessage,
        });
        await welcomeNotification.save();

        return res.status(200).json({
            status: 200,
            message: 'Verification status updated successfully',
            data: user,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.getVerifiedUsers = async (req, res) => {
    try {
        const verifiedUsers = await User.find({ isVerified: true });

        if (!verifiedUsers || verifiedUsers.length === 0) {
            return res.status(404).json({ status: 404, message: 'No verified users found' });
        }

        return res.status(200).json({ status: 200, data: verifiedUsers });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Failed to retrieve verified users', error: error.message });
    }
};

exports.getRejectUsers = async (req, res) => {
    try {
        const verifiedUsers = await User.find({ isVerified: false, isRejectUser: true });

        if (!verifiedUsers || verifiedUsers.length === 0) {
            return res.status(404).json({ status: 404, message: 'No rejected users found' });
        }

        return res.status(200).json({ status: 200, data: verifiedUsers });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Failed to retrieve Rejected users', error: error.message });
    }
};

exports.createLocation = async (req, res) => {
    try {
        const userId = req.user._id;

        const { name, coordinates, type, address } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const pickupLocation = new Location({
            user: user.id,
            name,
            coordinates,
            type: 'pickup',
            address,
        });

        const savedPickupLocation = await pickupLocation.save();

        const dropLocation = new Location({
            user: user.id,
            name: savedPickupLocation.name,
            coordinates: savedPickupLocation.coordinates,
            type: 'drop',
            address: savedPickupLocation.address,
        });

        const savedDropLocation = await dropLocation.save();

        res.status(201).json({
            status: 201,
            message: 'Pickup and drop locations created successfully',
            data: { pickupLocation: savedPickupLocation, dropLocation: savedDropLocation },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.getAllLocations = async (req, res) => {
    try {
        const locations = await Location.find();
        res.status(200).json({ status: 200, data: locations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.getLocationById = async (req, res) => {
    try {
        const locationId = req.params.id;
        const location = await Location.findById(locationId);

        if (!location) {
            return res.status(404).json({ status: 404, message: 'Location not found' });
        }

        res.status(200).json({ status: 200, data: location });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.updateLocationById = async (req, res) => {
    try {
        const userId = req.user._id;
        const locationId = req.params.id;
        const updateFields = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const existingLocation = await Location.findById(locationId);

        if (!existingLocation) {
            return res.status(404).json({ status: 404, message: 'Location not found' });
        }

        if (existingLocation.user.toString() !== userId.toString()) {
            return res.status(403).json({ status: 403, message: 'Unauthorized: User does not have permission to update this location' });
        }

        const updatedLocation = await Location.findByIdAndUpdate(locationId, updateFields, { new: true });

        if (existingLocation.type === 'pickup') {
            const dropLocation = await Location.findOneAndUpdate(
                { name: existingLocation.name, type: 'drop', user: userId },
                updateFields,
                { new: true }
            );

            res.status(200).json({
                status: 200,
                message: 'Locations updated successfully',
                data: { pickupLocation: updatedLocation, dropLocation },
            });
        } else {
            res.status(200).json({ status: 200, message: 'Location updated successfully', data: updatedLocation });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.deleteLocationById = async (req, res) => {
    try {
        const locationId = req.params.id;
        const deletedLocation = await Location.findByIdAndDelete(locationId);

        if (!deletedLocation) {
            return res.status(404).json({ status: 404, message: 'Location not found' });
        }

        if (deletedLocation.type === 'pickup') {
            const dropLocation = await Location.findOne({
                name: deletedLocation.name,
                type: 'drop',
                coordinates: deletedLocation.coordinates,
                address: deletedLocation.address,
            });

            if (dropLocation) {
                await Location.findByIdAndDelete(dropLocation._id);
            }
        }

        res.status(200).json({ status: 200, message: 'Location deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.getLocationsByType = async (req, res) => {
    try {
        const { type } = req.params;

        const locations = await Location.find({ type: type });
        console.log(locations);

        if (locations && locations.length > 0) {
            return res.json(locations);
        } else {
            return res.status(404).json({ message: `No locations found for type: ${type}` });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: `Failed to retrieve locations for type: ${type}` });
    }
};

exports.createStore = async (req, res) => {
    try {
        const { name, location, isAvailable, openTime, closeTime, userType, partner } = req.body;

        if (!req.file) {
            return res.status(400).json({ status: 400, error: "Image file is required" });
        }

        const existingLocation = await Location.findById(location);

        if (!existingLocation) {
            return res.status(404).json({ status: 404, message: 'Location not found' });
        }

        const newStore = await Store.create({
            name,
            image: req.file.path,
            location,
            isAvailable: isAvailable || true,
            openTime,
            closeTime,
            userType,
            partner
        });

        return res.status(201).json({ status: 201, message: 'Store created successfully', data: newStore });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getAllStores = async (req, res) => {
    try {
        const stores = await Store.find().populate('location partner');

        return res.status(200).json({ status: 200, data: stores });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getStoreById = async (req, res) => {
    try {
        const storeId = req.params.storeId;
        const store = await Store.findById(storeId).populate('location partner');

        if (!store) {
            return res.status(404).json({ status: 404, message: 'Store not found', data: null });
        }

        return res.status(200).json({ status: 200, data: store });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.updateStoreById = async (req, res) => {
    try {
        const storeId = req.params.storeId;
        const { name, location, isAvailable, openTime, closeTime, userType, partner } = req.body;

        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({ status: 404, message: 'Store not found', data: null });
        }

        if (location) {
            const existingLocation = await Location.findById(location);

            if (!existingLocation) {
                return res.status(404).json({ status: 404, message: 'Location not found' });
            }
        }

        if (name && name !== store.name) {
            const duplicateStore = await Store.findOne({ name });

            if (duplicateStore) {
                return res.status(400).json({
                    status: 400,
                    message: 'Store with the updated name already exists',
                });
            }

            store.name = name;
        }

        if (req.file) {
            store.image = req.file.path;
        }

        store.location = location || store.location;
        store.isAvailable = isAvailable || store.isAvailable;
        store.openTime = openTime || store.openTime;
        store.closeTime = closeTime || store.closeTime;
        store.userType = userType || store.userType;
        store.partner = partner || store.partner;

        const updatedStore = await store.save();

        return res.status(200).json({ status: 200, message: 'Store updated successfully', data: updatedStore });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.deleteStoreById = async (req, res) => {
    try {
        const storeId = req.params.storeId;

        const store = await Store.findByIdAndDelete(storeId);
        if (!store) {
            return res.status(404).json({ status: 404, message: 'Store not found', data: null });
        }

        return res.status(200).json({ status: 200, message: 'Store deleted successfully', data: null });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.registrationPartnerByAdmin = async (req, res) => {
    const { mobileNumber, email, userType } = req.body;
    try {
        req.body.email = email.split(" ").join("").toLowerCase();
        let user = await User.findOne({ $and: [{ $or: [{ email: req.body.email }, { mobileNumber: mobileNumber }] }], userType: userType });
        if (!user) {
            req.body.password = bcrypt.hashSync(req.body.password, 8);
            req.body.userType = userType;
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

exports.updatePartnerIdInStore = async (req, res) => {
    try {
        const storeId = req.params.storeId;
        const { partnerId } = req.body;

        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({ status: 404, message: 'Store not found', data: null });
        }

        const user = await User.findOne({ _id: partnerId, userType: "PARTNER" });
        if (!user) {
            return res.status(404).json({ status: 404, message: 'Partner not found' });
        }

        store.partner = partnerId;

        const updatedStore = await store.save();

        return res.status(200).json({
            status: 200,
            message: 'Partner ID updated in the store successfully',
            data: updatedStore,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getPartnerIdByStoreId = async (req, res) => {
    try {
        const { storeId } = req.params;

        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({ status: 404, message: 'Store not found', data: null });
        }

        return res.status(200).json({
            status: 200,
            message: 'Partner ID retrieved successfully',
            data: store,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.deletePartnerIdFromStore = async (req, res) => {
    try {
        const { storeId } = req.params;

        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({ status: 404, message: 'Store not found', data: null });
        }

        store.partner = null;
        const updatedStore = await store.save();

        return res.status(200).json({
            status: 200,
            message: 'Partner ID deleted from the store successfully',
            data: updatedStore,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.createBike = async (req, res) => {
    try {
        const userId = req.user._id;
        const { brand, model, type, color, engineHP, mileage, speedLimit, isPremium, isAvailable, numberOfSeats, aboutBike, rentalPrice, pickup, rentalExtendedPrice, depositMoney, totalKm, bikeNumber, isSubscription, subscriptionAmount } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const pickupLocation = await Location.findById(pickup);
        if (!pickupLocation) {
            return res.status(404).json({ status: 404, message: 'Pickup location not found' });
        }

        if (pickupLocation.user.toString() !== userId.toString()) {
            return res.status(403).json({ status: 403, message: 'You do not have permission to use the specified pickup location' });
        }

        const dropLocation = await Location.findOne({
            user: userId,
            name: pickupLocation.name,
            coordinates: pickupLocation.coordinates,
            type: 'drop',
            address: pickupLocation.address,
        });

        if (!dropLocation || dropLocation.user.toString() !== userId.toString()) {
            return res.status(403).json({ status: 403, message: 'You do not have permission to use the specified drop location' });
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

        const newBike = await Bike.create({
            owner: userId,
            brand,
            model,
            type,
            color,
            engineHP,
            mileage,
            speedLimit,
            isPremium,
            isAvailable,
            numberOfSeats,
            aboutBike,
            rentalPrice,
            images,
            pickup,
            drop: dropLocation._id,
            depositMoney,
            rentalExtendedPrice,
            bikeNumber,
            totalKm,
            subscriptionAmount,
            isSubscription
        });

        return res.status(201).json({ status: 201, message: 'Bike created successfully', data: newBike });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Server error' });
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

exports.updateBikeById = async (req, res) => {
    try {
        const userId = req.user._id;
        const bikeId = req.params.id;
        const updateFields = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        let images = [];
        if (req.files && req.files.length > 0) {
            for (let j = 0; j < req.files.length; j++) {
                let obj = {
                    img: req.files[j].path,
                };
                images.push(obj);
            }
        }

        const { pickup } = updateFields;

        const pickupLocation = await Location.findById(pickup);
        if (!pickupLocation) {
            return res.status(404).json({ status: 404, message: 'Pickup location not found' });
        }

        if (pickupLocation.user.toString() !== userId.toString()) {
            return res.status(403).json({ status: 403, message: 'You do not have permission to use the specified pickup location' });
        }

        const dropLocation = await Location.findOne({
            user: userId,
            name: pickupLocation.name,
            coordinates: pickupLocation.coordinates,
            type: 'drop',
            address: pickupLocation.address,
        });

        if (!dropLocation || dropLocation.user.toString() !== userId.toString()) {
            return res.status(403).json({ status: 403, message: 'You do not have permission to use the specified drop location' });
        }


        const updatedBikeFields = {
            ...updateFields,
            owner: user.id,
        };

        if (images.length > 0) {
            updatedBikeFields.images = images;
        }

        if (dropLocation) {
            updatedBikeFields.pickup = pickupLocation;
            updatedBikeFields.drop = dropLocation;
        }

        const updatedBike = await Bike.findByIdAndUpdate(bikeId, updatedBikeFields, { new: true });

        if (!updatedBike) {
            return res.status(404).json({ status: 404, message: 'Bike not found' });
        }

        return res.status(200).json({ status: 200, message: 'Bike updated successfully', data: updatedBike });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Server error' });
    }
};

exports.deleteBikeById = async (req, res) => {
    try {
        const bikeId = req.params.id;

        const deletedBike = await Bike.findByIdAndDelete(bikeId);

        if (!deletedBike) {
            return res.status(404).json({ status: 404, message: 'Bike not found' });
        }

        return res.status(200).json({ status: 200, message: 'Bike deleted successfully', data: deletedBike });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Server error' });
    }
};

exports.createBikeStoreRelation = async (req, res) => {
    try {
        const { bikeId, storeId, accessoryId, totalNumberOfBikes, totalNumberOfAccessory } = req.body;

        let totalNumberOfPartnerBikes = 0;
        let totalNumberOfPartnerAccessory = 0;

        if (bikeId) {
            const bike = await Bike.findById(bikeId);
            if (!bike) {
                return res.status(404).json({ status: 404, message: 'Bike not found', data: null });
            }

            const storeRelations = await BikeStoreRelation.find({ store: storeId });
            const existingBikeRelation = storeRelations.find(relation => relation.bike.toString() === bikeId);

            if (existingBikeRelation) {
                return res.status(400).json({
                    status: 400,
                    message: 'Relation already exists for the given bike and store',
                    data: null,
                });
            }

            totalNumberOfPartnerBikes = storeRelations.reduce((total, relation) => total + relation.totalNumberOfPartnerBikes, 0) + 1;
        }

        if (accessoryId) {
            const accessory = await Accessory.findById(accessoryId);
            if (!accessory) {
                return res.status(404).json({ status: 404, message: 'Accessory not found', data: null });
            }

            const accessoryRelations = await BikeStoreRelation.find({ store: storeId });
            const existingAccessoryRelation = accessoryRelations.find(relation => relation.accessory.toString() === accessoryId);

            if (existingAccessoryRelation) {
                return res.status(400).json({
                    status: 400,
                    message: 'Relation already exists for the given accessory and store',
                    data: null,
                });
            }

            totalNumberOfPartnerAccessory = accessoryRelations.reduce((total, relation) => total + relation.totalNumberOfPartnerAccessory, 0) + 1;
        }

        const newRelation = await BikeStoreRelation.create({
            bike: bikeId,
            store: storeId,
            accessory: accessoryId,
            totalNumberOfBikes: totalNumberOfBikes,
            totalNumberOfAccessory: totalNumberOfAccessory,
            totalNumberOfPartnerBikes: totalNumberOfPartnerBikes,
            totalNumberOfPartnerAccessory: totalNumberOfPartnerAccessory,
        });

        return res.status(201).json({
            status: 201,
            message: 'Bike-Store relation created successfully',
            data: newRelation,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getAllBikeStoreRelations = async (req, res) => {
    try {
        const relations = await BikeStoreRelation.find().populate({
            path: 'store',
            populate: { path: 'location' }
        }).populate('bike')
            .populate({
                path: 'accessory',
                populate: { path: 'category' }
            });
        return res.status(200).json({ status: 200, message: 'Bike-Store relations retrieved successfully', data: relations });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getBikeStoreRelationById = async (req, res) => {
    try {
        const relationId = req.params.relationId;
        const relation = await BikeStoreRelation.findById(relationId).populate({
            path: 'store',
            populate: { path: 'location' }
        }).populate('bike')
            .populate({
                path: 'accessory',
                populate: { path: 'category' }
            });

        if (!relation) {
            return res.status(404).json({ status: 404, message: 'Bike-Store relation not found', data: null });
        }

        return res.status(200).json({ status: 200, message: 'Bike-Store relation retrieved successfully', data: relation });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.updateBikeStoreRelation = async (req, res) => {
    try {
        const relationId = req.params.relationId;
        const { bikeId, storeId, accessoryId, totalNumberOfBikes, totalNumberOfBookedBikes, totalNumberOfAccessory, totalNumberOfBookedAccessory } = req.body;

        const existingRelation = await BikeStoreRelation.findById(relationId);
        if (!existingRelation) {
            return res.status(404).json({ status: 404, message: 'Bike-Store relation not found', data: null });
        }

        if (bikeId) {
            const bike = await Bike.findById(bikeId);
            if (!bike) {
                return res.status(404).json({ status: 404, message: 'Bike not found', data: null });
            }
            const existingBikeRelation = await BikeStoreRelation.findOne({ bike: bikeId, store: storeId });
            if (existingBikeRelation && existingBikeRelation._id.toString() !== relationId) {
                return res.status(400).json({ status: 400, message: 'Relation already exists for the given bike and store', data: null });
            }
            existingRelation.bike = bikeId;
        }

        if (accessoryId) {
            const accessory = await Accessory.findById(accessoryId);
            if (!accessory) {
                return res.status(404).json({ status: 404, message: 'Accessory not found', data: null });
            }
            const existingAccessoryRelation = await BikeStoreRelation.findOne({ accessory: accessoryId, store: storeId });
            if (existingAccessoryRelation && existingAccessoryRelation._id.toString() !== relationId) {
                return res.status(400).json({ status: 400, message: 'Relation already exists for the given accessory and store', data: null });
            }
            existingRelation.accessory = accessoryId;
        }

        if (totalNumberOfBikes !== undefined) {
            existingRelation.totalNumberOfBikes = totalNumberOfBikes;
        }
        if (totalNumberOfBookedBikes !== undefined) {
            existingRelation.totalNumberOfBookedBikes = totalNumberOfBookedBikes;
        }
        if (totalNumberOfAccessory !== undefined) {
            existingRelation.totalNumberOfAccessory = totalNumberOfAccessory;
        }
        if (totalNumberOfBookedAccessory !== undefined) {
            existingRelation.totalNumberOfBookedAccessory = totalNumberOfBookedAccessory;
        }

        const updatedRelation = await existingRelation.save();

        return res.status(200).json({ status: 200, message: 'Bike-Store relation updated successfully', data: updatedRelation });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.deleteBikeStoreRelation = async (req, res) => {
    try {
        const relationId = req.params.relationId;

        const deletedRelation = await BikeStoreRelation.findByIdAndDelete(relationId);
        if (!deletedRelation) {
            return res.status(404).json({ status: 404, message: 'Bike-Store relation not found', data: null });
        }

        return res.status(200).json({ status: 200, message: 'Bike-Store relation deleted successfully', data: deletedRelation });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getBikesByStoreAndPartner = async (req, res) => {
    try {
        const { storeId, partnerId } = req.params;

        const relation = await BikeStoreRelation.find({ store: storeId, partner: partnerId }).populate({
            path: 'store',
            populate: { path: 'location' }
        }).populate('bike')
            .populate({
                path: 'accessory',
                populate: { path: 'category' }
            });

        if (!relation) {
            return res.status(404).json({ status: 404, message: 'Relation not found', data: null });
        }

        return res.status(200).json({
            status: 200,
            message: 'Bikes retrieved successfully by store and partner',
            data: relation,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getAccessoryByPartnerId = async (req, res) => {
    try {
        const partnerId = req.params.partnerId;

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

exports.createCoupon = async (req, res) => {
    try {
        const { title, desc, code, discount, isPercent, expirationDate, isActive } = req.body;

        const newCoupon = await Coupon.create({
            title,
            desc,
            code,
            discount,
            isPercent,
            expirationDate,
            isActive,
        });

        res.status(201).json({ status: 201, message: 'Coupon created successfully', data: newCoupon });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, error: 'Server error' });
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

exports.updateCouponById = async (req, res) => {
    try {
        const couponId = req.params.id;
        const updateFields = req.body;

        const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, updateFields, { new: true });

        if (!updatedCoupon) {
            return res.status(404).json({ status: 404, message: 'Coupon not found' });
        }

        res.status(200).json({ status: 200, message: 'Coupon updated successfully', data: updatedCoupon });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, error: 'Server error' });
    }
};

exports.deleteCouponById = async (req, res) => {
    try {
        const couponId = req.params.id;
        const deletedCoupon = await Coupon.findByIdAndDelete(couponId);

        if (!deletedCoupon) {
            return res.status(404).json({ status: 404, message: 'Coupon not found' });
        }

        res.status(200).json({ status: 200, message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, error: 'Server error' });
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().populate('bike user pickupLocation dropOffLocation');

        return res.status(200).json({ status: 200, data: bookings });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('bike user pickupLocation dropOffLocation');
        if (!booking) {
            return res.status(404).json({ status: 404, message: 'Booking not found', data: null });
        }
        return res.status(200).json({ status: 200, data: booking });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.createAccessoryCategory = async (req, res) => {
    try {
        const { name, description, status } = req.body;

        if (!req.file) {
            return res.status(400).json({ status: 400, error: "Image file is required" });
        }

        const existingCategory = await AccessoryCategory.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ status: 400, message: 'Accessory category with this name already exists', data: null });
        }

        const newCategory = await AccessoryCategory.create({ name, description, status, image: req.file.path, });

        return res.status(201).json({ status: 201, message: 'Accessory category created successfully', data: newCategory });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
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

exports.updateAccessoryCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const { name, description, status } = req.body;

        let imagePath;

        if (req.file) {
            imagePath = req.file.path;
        }

        const updatedCategory = await AccessoryCategory.findByIdAndUpdate(
            categoryId,
            { name, description, status, image: imagePath },
            { new: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ status: 404, message: 'Accessory category not found', data: null });
        }

        return res.status(200).json({ status: 200, message: 'Accessory category updated successfully', data: updatedCategory });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.deleteAccessoryCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;

        const deletedCategory = await AccessoryCategory.findByIdAndDelete(categoryId);

        if (!deletedCategory) {
            return res.status(404).json({ status: 404, message: 'Accessory category not found', data: null });
        }

        return res.status(200).json({ status: 200, message: 'Accessory category deleted successfully', data: deletedCategory });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.createAccessory = async (req, res) => {
    try {
        const { name, description, categoryId, price, stock, size, status } = req.body;

        if (!req.file) {
            return res.status(400).json({ status: 400, error: "Image file is required" });
        }

        const category = await AccessoryCategory.findById(categoryId);
        if (!category) {
            return res.status(400).json({ status: 400, message: 'Invalid accessory category ID', data: null });
        }

        const newAccessory = await Accessory.create({
            name,
            description,
            category: categoryId,
            price,
            stock,
            image: req.file.path,
            size,
            status
        });

        return res.status(201).json({ status: 201, message: 'Accessory created successfully', data: newAccessory });
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

exports.updateAccessory = async (req, res) => {
    try {
        const accessoryId = req.params.accessoryId;
        const { name, description, categoryId, price, stock, size, status } = req.body;

        let imagePath;

        if (req.file) {
            imagePath = req.file.path;
        }

        const category = await AccessoryCategory.findById(categoryId);
        if (!category) {
            return res.status(400).json({ status: 400, message: 'Invalid accessory category ID', data: null });
        }

        const updatedAccessory = await Accessory.findByIdAndUpdate(
            accessoryId,
            { name, description, categoryId, price, stock, size, status, image: imagePath, },
            { new: true }
        ).populate('category');

        if (!updatedAccessory) {
            return res.status(404).json({ status: 404, message: 'Accessory not found', data: null });
        }

        return res.status(200).json({ status: 200, message: 'Accessory updated successfully', data: updatedAccessory });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.deleteAccessory = async (req, res) => {
    try {
        const accessoryId = req.params.accessoryId;

        const deletedAccessory = await Accessory.findByIdAndDelete(accessoryId);

        if (!deletedAccessory) {
            return res.status(404).json({ status: 404, message: 'Accessory not found', data: null });
        }

        return res.status(200).json({ status: 200, message: 'Accessory deleted successfully', data: deletedAccessory });
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

exports.createGST = async (req, res) => {
    try {
        const { name, rate, status } = req.body;
        const newGST = await GST.create({ name, rate, status });
        return res.status(201).json({ status: 201, message: 'GST entry created successfully', data: newGST });
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

exports.updateGST = async (req, res) => {
    try {
        const { name, rate, status } = req.body;
        const updatedGST = await GST.findByIdAndUpdate(req.params.id, { name, rate, status }, { new: true });
        if (!updatedGST) {
            return res.status(404).json({ status: 404, message: 'GST entry not found', data: null });
        }
        return res.status(200).json({ status: 200, message: 'GST entry updated successfully', data: updatedGST });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.deleteGST = async (req, res) => {
    try {
        const deletedGST = await GST.findByIdAndDelete(req.params.id);
        if (!deletedGST) {
            return res.status(404).json({ status: 404, message: 'GST entry not found', data: null });
        }
        return res.status(200).json({ status: 200, message: 'GST entry deleted successfully', data: null });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.createInquiry = async (req, res) => {
    try {
        const { mobileNumber, email } = req.body;

        const newInquiry = await HelpAndSupport.create({
            mobileNumber,
            email,
        });

        return res.status(201).json({
            status: 201,
            message: 'Inquiry created successfully',
            data: newInquiry,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getInquiries = async (req, res) => {
    try {
        const inquiries = await HelpAndSupport.find().sort({ createdAt: -1 }).populate('messages.user');

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

exports.updateInquiry = async (req, res) => {
    try {
        const { inquiryId } = req.params;
        const { mobileNumber, email } = req.body;

        const updatedInquiry = await HelpAndSupport.findByIdAndUpdate(
            inquiryId,
            { mobileNumber, email },
            { new: true }
        );

        if (!updatedInquiry) {
            return res.status(404).json({
                status: 404,
                message: 'Inquiry not found',
                data: null,
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'Inquiry updated successfully',
            data: updatedInquiry,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.deleteInquiry = async (req, res) => {
    try {
        const { inquiryId } = req.params;

        const deletedInquiry = await HelpAndSupport.findByIdAndDelete(inquiryId);

        if (!deletedInquiry) {
            return res.status(404).json({
                status: 404,
                message: 'Inquiry not found',
                data: null,
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'Inquiry deleted successfully',
            data: deletedInquiry,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.createNotification = async (req, res) => {
    try {
        const { recipient, content } = req.body;

        const notification = new Notification({ recipient, content });
        await notification.save();

        return res.status(201).json({ status: 201, message: 'Notification created successfully', data: notification });
    } catch (error) {
        return res.status(500).json({ status: 500, message: 'Error creating notification', error: error.message });
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
        const notifications = await Notification.find();

        return res.status(200).json({ status: 200, message: 'Notifications retrieved successfully', data: notifications });
    } catch (error) {
        return res.status(500).json({ status: 500, message: 'Error retrieving notifications', error: error.message });
    }
};

exports.createTermAndCondition = async (req, res) => {
    try {
        const { content } = req.body;

        const termAndCondition = new TermAndCondition({ content });
        await termAndCondition.save();

        return res.status(201).json({ status: 201, message: 'Terms and Conditions created successfully', data: termAndCondition });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', details: error.message });
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

exports.updateTermAndConditionById = async (req, res) => {
    try {
        const termAndConditionId = req.params.id;
        const { content } = req.body;

        const updatedTermAndCondition = await TermAndCondition.findByIdAndUpdate(
            termAndConditionId,
            { content },
            { new: true }
        );

        if (!updatedTermAndCondition) {
            return res.status(404).json({ status: 404, message: 'Terms and Conditions not found' });
        }

        return res.status(200).json({ status: 200, message: 'Terms and Conditions updated successfully', data: updatedTermAndCondition });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', details: error.message });
    }
};

exports.deleteTermAndConditionById = async (req, res) => {
    try {
        const termAndConditionId = req.params.id;
        const deletedTermAndCondition = await TermAndCondition.findByIdAndDelete(termAndConditionId);

        if (!deletedTermAndCondition) {
            return res.status(404).json({ status: 404, message: 'Terms and Conditions not found' });
        }

        return res.status(200).json({ status: 200, message: 'Terms and Conditions deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', details: error.message });
    }
};

exports.createCancelationPolicy = async (req, res) => {
    try {
        const { content } = req.body;

        const cancelationPolicy = new CancelationPolicy({ content });
        await cancelationPolicy.save();

        return res.status(201).json({ status: 201, message: 'Cancelation and Policy created successfully', data: cancelationPolicy });
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

exports.updateCancelationPolicyById = async (req, res) => {
    try {
        const cancelationPolicyId = req.params.id;
        const { content } = req.body;

        const updatedCancelationPolicy = await CancelationPolicy.findByIdAndUpdate(
            cancelationPolicyId,
            { content },
            { new: true }
        );

        if (!updatedCancelationPolicy) {
            return res.status(404).json({ status: 404, message: 'Terms and Conditions not found' });
        }

        return res.status(200).json({ status: 200, message: 'cancelation and Policy updated successfully', data: updatedCancelationPolicy });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', details: error.message });
    }
};

exports.deleteCancelationPolicyById = async (req, res) => {
    try {
        const cancelationPolicyId = req.params.id;
        const deletedCancelationPolicy = await CancelationPolicy.findByIdAndDelete(cancelationPolicyId);

        if (!deletedCancelationPolicy) {
            return res.status(404).json({ status: 404, message: 'Cancelation and Policy not found' });
        }

        return res.status(200).json({ status: 200, message: 'Cancelation and Policy deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', details: error.message });
    }
};

exports.createSubjectsCategory = async (req, res) => {
    try {
        const { name, status } = req.body;

        const existingCategory = await SubjectsCategory.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ status: 400, message: 'Accessory category with this name already exists', data: null });
        }

        const newCategory = await SubjectsCategory.create({ name, status });

        return res.status(201).json({ status: 201, message: 'Subjects category created successfully', data: newCategory });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
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

exports.updateSubjectsCategory = async (req, res) => {
    try {
        const subjectId = req.params.subjectId;
        const { name, status } = req.body;

        const updatedCategory = await SubjectsCategory.findByIdAndUpdate(
            subjectId,
            { name, status, },
            { new: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ status: 404, message: 'Subjects Category not found', data: null });
        }

        return res.status(200).json({ status: 200, message: 'Subjects Category updated successfully', data: updatedCategory });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.deleteSubjectsCategory = async (req, res) => {
    try {
        const subjectId = req.params.subjectId;

        const deletedCategory = await SubjectsCategory.findByIdAndDelete(subjectId);

        if (!deletedCategory) {
            return res.status(404).json({ status: 404, message: 'Subjects Category not found', data: null });
        }

        return res.status(200).json({ status: 200, message: 'Subjects Category deleted successfully', data: deletedCategory });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getBussinesInquary = async (req, res) => {
    try {
        const inquiries = await BussinesInquary.find().sort({ createdAt: -1 }).populate('messages.user', 'subjectId');

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

exports.replyBussinesInquary = async (req, res) => {
    try {
        const { bussinesInquaryId } = req.params;
        const { reply } = req.body;

        const inquiry = await BussinesInquary.findByIdAndUpdate(
            bussinesInquaryId,
            { $push: { 'messages': { reply, user: req.user._id } } },
            { new: true }
        );

        if (!inquiry) {
            return res.status(404).json({
                status: 404,
                message: 'Bussines Inquary not found',
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

exports.getAllPendingStories = async (req, res) => {
    try {
        const stories = await Story.find({ isAdminApproved: false }).sort({ createdAt: -1 });

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

exports.getAllApprovedStories = async (req, res) => {
    try {
        const stories = await Story.find({ isAdminApproved: true }).sort({ createdAt: -1 });

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

        const story = await Story.findById(storyId);

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

exports.approvedRejectStory = async (req, res) => {
    try {
        const { storyId } = req.params;
        const { status, isAdminApproved } = req.body;


        const updatedStory = await Story.findByIdAndUpdate(
            storyId,
            { status, isAdminApproved },
            { new: true }
        );

        if (!updatedStory) {
            return res.status(404).json({
                status: 404,
                message: 'Story not found',
                data: null,
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'Story updated successfully',
            data: updatedStory,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.updateStory = async (req, res) => {
    try {
        const { storyId } = req.params;
        const { name, text, status } = req.body;

        let images = [];
        if (req.files && req.files.length > 0) {
            for (let j = 0; j < req.files.length; j++) {
                let obj = {
                    img: req.files[j].path,
                };
                images.push(obj);
            }
        }

        const updatedStory = await Story.findByIdAndUpdate(
            storyId,
            { name, images, text, status },
            { new: true }
        );

        if (!updatedStory) {
            return res.status(404).json({
                status: 404,
                message: 'Story not found',
                data: null,
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'Story updated successfully',
            data: updatedStory,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.deleteStory = async (req, res) => {
    try {
        const { storyId } = req.params;

        const deletedStory = await Story.findByIdAndDelete(storyId);

        if (!deletedStory) {
            return res.status(404).json({
                status: 404,
                message: 'Story not found',
                data: null,
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'Story deleted successfully',
            data: deletedStory,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, message: 'Server error', data: null });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate('user').populate('items.accessory').populate('shippingAddress');

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

        const order = await Order.findById(orderId).populate('user').populate('items.accessory').populate('shippingAddress');

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

exports.createRefundCharge = async (req, res) => {
    try {
        const { refundAmount } = req.body;

        const newRefundCharge = new RefundCharge({ refundAmount });

        const savedRefundCharge = await newRefundCharge.save();

        return res.status(201).json({
            status: 201,
            message: 'Refund charge created successfully',
            data: savedRefundCharge,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllRefundCharges = async (req, res) => {
    try {
        const refundCharges = await RefundCharge.find();
        return res.status(200).json({ status: 200, data: refundCharges });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

exports.getRefundChargeById = async (req, res) => {
    try {
        const refundCharge = await RefundCharge.findById(req.params.id);
        if (!refundCharge) {
            return res.status(404).json({ status: 404, message: 'Refund charge not found' });
        }
        return res.status(200).json({ status: 200, data: refundCharge });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

exports.updateRefundChargeById = async (req, res) => {
    try {
        const refundCharge = await RefundCharge.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!refundCharge) {
            return res.status(404).json({ status: 404, message: 'Refund charge not found' });
        }
        return res.status(200).json({ sataus: 200, message: 'Refund charge updated sucessfully', data: refundCharge });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteRefundChargeById = async (req, res) => {
    try {
        const refundCharge = await RefundCharge.findByIdAndDelete(req.params.id);
        if (!refundCharge) {
            return res.status(404).json({ status: 404, message: 'Refund charge not found' });
        }
        return res.status(200).json({
            status: 200,
            message: 'Refund  deleted successfully',
            data: refundCharge,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

exports.updateRefundPaymentStatus = async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const { refundStatus, refundTransactionId } = req.body;

        const updatedBooking = await Booking.findOne({ _id: bookingId });

        if (!updatedBooking) {
            return res.status(404).json({ status: 404, message: 'Booking not found', data: null });
        }

        const refundId = await Refund.findOne({ booking: bookingId });

        if (!refundId) {
            return res.status(404).json({ status: 404, message: 'RefundId not found', data: null });
        }

        const validStatusValues = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];
        if (!validStatusValues.includes(refundStatus)) {
            return res.status(400).json({ error: "Invalid RefundStatus status value" });
        }

        refundId.refundStatus = refundStatus;
        refundId.refundTransactionId = refundTransactionId;
        refundId.refundTransactionDate = new Date;

        await refundId.save();

        if (refundId.refundStatus === 'PENDING' || refundId.refundStatus === 'PROCESSING') {
            if (refundId.type === 'WALLET') {
                const user = await User.findById(updatedBooking.user);
                if (!user) {
                    return res.status(404).json({ status: 404, message: 'User not found', data: null });
                }

                user.wallet += refundId.totalRefundAmount;
                await user.save();
            }
        }

        return res.status(200).json({
            status: 200,
            message: 'Payment status updated successfully',
            data: refundId,
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

exports.getRefundStatusAndAmount = async (req, res) => {
    try {
        const bookingId = req.params.bookingId;

        const booking = await Booking.findOne({ _id: bookingId });

        if (!booking) {
            return res.status(404).json({ status: 404, message: 'Booking not found', data: null });
        }

        const refund = await Refund.findOne({ booking: bookingId });

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

async function generateQRCode(data) {
    return QRCode.toDataURL(data);
}

async function updateUserQRCode(userId, qrCodeDataUri) {
    await User.findByIdAndUpdate(userId, { qrCode: qrCodeDataUri });
}

exports.generateQrCodeForVendor = async (req, res) => {
    try {
        const userId = req.params.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const qrCodeDataUri = await generateQRCode(user._id.toString());

        await updateUserQRCode(userId, qrCodeDataUri);

        return res.json({ message: 'QR Code generated and saved successfully', data: qrCodeDataUri });
    } catch (error) {
        console.error('Error generating or saving QR Code:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getQrCodeForVendor = async (req, res) => {
    try {
        const userId = req.params.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.json({ qrCode: user.qrCode });
    } catch (error) {
        console.error('Error getting QR Code:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.updateQrCodeForVendor = async (req, res) => {
    try {
        const userId = req.params.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const updatedQrCode = await generateQRCode(user._id.toString());

        await updateUserQRCode(userId, updatedQrCode);

        return res.json({ message: 'QR Code updated successfully' });
    } catch (error) {
        console.error('Error updating QR Code:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.deleteQrCodeForVendor = async (req, res) => {
    try {
        const userId = req.params.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await updateUserQRCode(userId, null); // Remove QR code data

        return res.json({ message: 'QR Code deleted successfully' });
    } catch (error) {
        console.error('Error deleting QR Code:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getAllFranchiseUser = async (req, res) => {
    try {
        const users = await User.find({ userType: "FRANCHISE-PARTNER" }).populate('city');

        if (!users || users.length === 0) {
            return res.status(404).json({ status: 404, message: 'Franchise partner users not found' });
        }

        const formattedUsers = [];
        for (const user of users) {
            const checkStore = await Store.find({ partner: user._id }).populate('location partner');
            if (!checkStore) {
                continue;
            }

            const formattedUser = {
                _id: user._id,
                user: user,
                stores: checkStore,
                memberSince: user.createdAt.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'numeric',
                    year: 'numeric',
                }),
            };
            formattedUsers.push(formattedUser);
        }

        return res.status(200).json({
            status: 200,
            data: formattedUsers,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 500, error: 'Internal Server Error' });
    }
};

exports.createCommission = async (req, res) => {
    try {
        const { partner } = req.params;
        const { store, commissionPercentage } = req.body;

        const user = await User.findById(partner);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const checkStore = await Store.findById(store).populate('location partner');
        if (!checkStore) {
            return res.status(404).json({ status: 404, message: 'Store not found', data: null });
        }

        const existingCommission = await Commission.findOne({ partner, store });
        if (existingCommission) {
            return res.status(400).json({ status: 400, message: 'Commission already exists for this partner and store' });
        }

        const commission = new Commission({
            partner,
            store,
            commissionPercentage
        });

        const newCommission = await commission.save();

        return res.status(201).json({ status: 201, message: 'Commission created successfully', data: newCommission });
    } catch (error) {
        console.error('Error creating commission:', error);
        return res.status(500).json({ status: 500, message: 'Internal server error', error: error.message });
    }
};


exports.getAllCommissions = async (req, res) => {
    try {
        const commissions = await Commission.find().populate('store partner');
        return res.status(200).json({ status: 200, message: 'Commissions found', data: commissions });
    } catch (error) {
        console.error('Error fetching commissions:', error);
        return res.status(500).json({ status: 500, message: 'Internal server error', error: error.message });
    }
};

exports.getCommissionById = async (req, res) => {
    try {
        const commission = await Commission.findById(req.params.id);
        if (!commission) {
            return res.status(404).json({ status: 404, message: 'Commission not found' });
        }
        return res.status(200).json({ status: 200, message: 'Commission found', data: commission });
    } catch (error) {
        console.error('Error fetching commission:', error);
        return res.status(500).json({ status: 500, message: 'Internal server error', error: error.message });
    }
};

exports.updateCommission = async (req, res) => {
    try {
        const { partner, store, commissionPercentage } = req.body;

        const commission = await Commission.findByIdAndUpdate(
            req.params.id,
            { partner, store, commissionPercentage },
            { new: true }
        );

        if (!commission) {
            return res.status(404).json({ status: 404, message: 'Commission not found' });
        }

        return res.status(200).json({ status: 200, message: 'Commission updated successfully', data: commission });
    } catch (error) {
        console.error('Error updating commission:', error);
        return res.status(500).json({ status: 500, message: 'Internal server error', error: error.message });
    }
};

exports.deleteCommission = async (req, res) => {
    try {
        const commission = await Commission.findByIdAndDelete(req.params.id);
        if (!commission) {
            return res.status(404).json({ status: 404, message: 'Commission not found' });
        }
        return res.status(200).json({ status: 200, message: 'Commission deleted successfully' });
    } catch (error) {
        console.error('Error deleting commission:', error);
        return res.status(500).json({ status: 500, message: 'Internal server error', error: error.message });
    }
};
