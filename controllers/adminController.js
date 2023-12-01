const User = require('../models/userModel');
const authConfig = require("../configs/auth.config");
const jwt = require("jsonwebtoken");
const newOTP = require("otp-generators");
const bcrypt = require("bcryptjs");
const City = require('../models/cityModel');



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
        const { isVerified } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        user.isVerified = isVerified;
        await user.save();

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



