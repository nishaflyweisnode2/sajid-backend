const auth = require("../controllers/userController");
const express = require("express");
const router = express()


const authJwt = require("../middlewares/auth");

const { profileImage } = require('../middlewares/imageUpload');



module.exports = (app) => {

    // api/v1/user/

    app.post("/api/v1/user/loginWithPhone", auth.loginWithPhone);
    app.post("/api/v1/user/:id", auth.verifyOtp);
    app.post("/api/v1/user/resendOtp/:id", auth.resendOTP);
    app.post("/api/v1/user/register/1", [authJwt.verifyToken], auth.registration);
    app.put("/api/v1/user/upload-id-picture", [authJwt.verifyToken], profileImage.single('image'), auth.uploadIdPicture);
    app.put("/api/v1/user/update-documents", [authJwt.verifyToken], auth.updateDocuments);
    app.put("/api/v1/user/updateLocation", [authJwt.verifyToken], auth.updateLocation);
    app.put("/api/v1/user/upload-profile-picture", [authJwt.verifyToken], profileImage.single('image'), auth.uploadProfilePicture);
    app.put("/api/v1/user/edit-profile", [authJwt.verifyToken], auth.editProfile);
    app.get("/api/v1/user/profile", [authJwt.verifyToken], auth.getUserProfile);
    app.get("/api/v1/user/profile/:userId", [authJwt.verifyToken], auth.getUserProfileById);
    app.get("/api/v1/user/city/cities", [authJwt.verifyToken], auth.getAllCities);
    app.get("/api/v1/user/city/cities/:id", [authJwt.verifyToken], auth.getCityById);
    app.get('/api/v1/user/bikes', [authJwt.verifyToken], auth.getAllBikes);
    app.get('/api/v1/user/bikes/:id', [authJwt.verifyToken], auth.getBikeById);
    app.get('/api/v1/user/coupons', [authJwt.verifyToken], auth.getAllCoupons);
    app.get('/api/v1/user/coupons/:id', [authJwt.verifyToken], auth.getCouponById);
    app.get('/api/v1/user/bike/availability', [authJwt.verifyToken], auth.checkBikeAvailability);
    app.post("/api/v1/user/booking/create", [authJwt.verifyToken], auth.createBooking);
    app.get('/api/v1/user/bookings/user', [authJwt.verifyToken], auth.getBookingsByUser);
    app.put('/api/v1/user/bookings/:id', [authJwt.verifyToken], auth.updateBookingById);
    app.post('/api/v1/user/coupon/apply-coupon', [authJwt.verifyToken], auth.applyCouponToBooking);
    app.post('/api/v1/user/coupon/remove-coupon', [authJwt.verifyToken], auth.removeCouponFromBooking);
    app.put('/api/v1/user/bookings/updatePaymentStatus/:bookingId', [authJwt.verifyToken], auth.updatePaymentStatus);
    app.post('/api/v1/user/bookings/:bookingId/extend', [authJwt.verifyToken], auth.extendBooking);
    app.put('/api/v1/user/bookings/:bookingId/cancel', [authJwt.verifyToken], auth.cancelBooking);



}