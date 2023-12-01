const authConfig = require("../configs/auth.config");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");



const verifyToken = (req, res, next) => {
    const token =
        req.get("Authorization")?.split("Bearer ")[1] ||
        req.headers["x-access-token"];
    // console.log("1", token);

    if (!token) {
        return res.status(403).json({
            message: "No token provided! Access prohibited",
        });
    } else {
        jwt.verify(token, authConfig.secret, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: "Unauthorized!", });
            }
            try {
                const user = await User.findOne({ _id: decoded.id });
                // console.log("2", decoded.id);
                // console.log("3", user._id);

                if (!user) {
                    return res.status(400).json({
                        message: "The user that this token belongs to does not exist",
                    });
                }
                req.user = user;
                next();
            } catch (error) {
                return res.status(500).json({
                    message: "Internal server error",
                });
            }
        });
    }
};


const isAdmin = (req, res, next) => {
    const token =
        req.headers["x-access-token"] ||
        req.get("Authorization")?.split("Bearer ")[1];

    if (!token) {
        return res.status(403).send({
            message: "No token provided! Access prohibited",
        });
    }

    jwt.verify(token, authConfig.secret, async (err, decoded) => {
        if (err) {
            return res.status(401).send({
                message: "Unauthorized! Admin role is required!",
            });
        }

        try {
            const user = await User.findOne({ _id: decoded.id });

            if (!user) {
                return res.status(400).send({
                    message: "The user that this token belongs to does not exist",
                });
            }

            if (user.userType !== "ADMIN") {
                return res.status(403).send({
                    message: "Access prohibited. Admin role is required!",
                });
            }

            req.user = user;
            next();
        } catch (error) {
            return res.status(500).json({
                message: "Internal server error",
            });
        }
    });
};


const isPartner = (req, res, next) => {
    const token =
        req.headers["x-access-token"] ||
        req.get("Authorization")?.split("Bearer ")[1];

    if (!token) {
        return res.status(403).send({
            message: "No token provided! Access prohibited",
        });
    }

    jwt.verify(token, authConfig.secret, async (err, decoded) => {
        if (err) {
            return res.status(401).send({
                message: "Unauthorized! Partner role is required!",
            });
        }

        try {
            const user = await User.findOne({ _id: decoded.id });

            if (!user) {
                return res.status(400).send({
                    message: "The user that this token belongs to does not exist",
                });
            }

            if (user.userType !== "PARTNER") {
                return res.status(403).send({
                    message: "Access prohibited. Partner role is required!",
                });
            }

            req.user = user;
            next();
        } catch (error) {
            return res.status(500).json({
                message: "Internal server error",
            });
        }
    });
};




module.exports = {
    verifyToken,
    isAdmin,
    isPartner
};