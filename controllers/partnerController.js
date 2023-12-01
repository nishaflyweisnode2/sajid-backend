const User = require('../models/userModel');
const authConfig = require("../configs/auth.config");
const jwt = require("jsonwebtoken");
const newOTP = require("otp-generators");
const bcrypt = require("bcryptjs");
const City = require('../models/cityModel');
const Bike = require('../models/bikeModel');
const Location = require("../models/locationModel");




exports.registration = async (req, res) => {
    const { phone, email } = req.body;
    try {
        req.body.email = email.split(" ").join("").toLowerCase();
        let user = await User.findOne({ $and: [{ $or: [{ email: req.body.email }, { phone: phone }] }], userType: "PARTNER" });
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

exports.createLocation = async (req, res) => {
    try {
        const userId = req.user._id;

        const { name, coordinates, type, address } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const newLocation = new Location({
            user: user.id,
            name,
            coordinates,
            type,
            address,
        });
        const savedLocation = await newLocation.save();
        res.status(201).json({ status: 201, message: 'Location created successfully', data: savedLocation });
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
        const locationId = req.params.id;
        const updateFields = req.body;

        const existingLocation = await Location.findById(locationId);

        if (!existingLocation) {
            return res.status(404).json({ status: 404, message: 'Location not found' });
        }

        const updatedLocation = await Location.findByIdAndUpdate(locationId, updateFields, { new: true });

        res.status(200).json({ status: 200, message: 'Location updated successfully', data: updatedLocation });
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

exports.createBike = async (req, res) => {
    try {
        const userId = req.user._id;
        const { brand, model, type, color, engineHP, mileage, speedLimit, isPremium, isAvailable, numberOfSeats, aboutBike, rentalPrice } = req.body;

        let images = [];
        if (req.files) {
            for (let j = 0; j < req.files.length; j++) {
                let obj = {
                    img: req.files[j].path,
                };
                images.push(obj);
            }
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        const newBike = await Bike.create({
            owner: user.id,
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
            images: images,
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

        const updatedBikeFields = {
            ...updateFields,
            owner: user.id,
        };

        if (images.length > 0) {
            updatedBikeFields.images = images;
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




