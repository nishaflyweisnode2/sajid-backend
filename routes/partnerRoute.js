const auth = require("../controllers/partnerController");
const express = require("express");
const router = express()


const authJwt = require("../middlewares/auth");

const { profileImage, cityImage, bikeImage, bikeApprovedImage } = require('../middlewares/imageUpload');



module.exports = (app) => {

    // api/v1/partner/

    app.post("/api/v1/partner/registration", auth.registration);
    app.post("/api/v1/partner/login", auth.signin);
    app.put("/api/v1/partner/update", [authJwt.isPartner], auth.update);
    app.get('/api/v1/partner/get-stores', [authJwt.isPartner], auth.getStoresByPartnerId);
    app.get('/api/v1/partner/bikes', [authJwt.isPartner], auth.getBikesByPartnerId);
    app.get('/api/v1/partner/bikes/:partnerId/:storeId', [authJwt.isPartner], auth.getBikeByPartnerAndStore);
    app.get('/api/v1/partner/upcoming-bookings', [authJwt.isPartner], auth.getUpcomingBookingsForPartner);
    app.get('/api/v1/partner/bookings/:bookingId', [authJwt.isPartner], auth.getBookingByIdForPartner);
    app.get('/api/v1/partner/completed-bookings', [authJwt.isPartner], auth.getCompletedBookingsForPartner);
    app.get('/api/v1/partner/canceled-bookings', [authJwt.isPartner], auth.getCanceledBookingsForPartner);
    app.get('/api/v1/partner/paymentFalied-bookings', [authJwt.isPartner], auth.getPaymentFaliedBookingsForPartner);
    app.put('/api/v1/partner/bookings/:bookingId/approve', [authJwt.isPartner], bikeApprovedImage.single('approvedImage'), auth.approveBookingStatus);
    app.post("/api/v1/partner/bookings/verify/:bookingId", [authJwt.isPartner], auth.approveBookingVerifyOtp);
    app.post("/api/v1/partner/bookings/resendOtp/:id", [authJwt.isPartner], auth.approveBookingResendOTP);
    app.get('/api/v1/partner/approved-bookings', [authJwt.isPartner], auth.getApprovedBookingsForPartner);
    app.put('/api/v1/partner/bookings/:bookingId/reject', [authJwt.isPartner], auth.rejectBookingStatus);
    app.post("/api/v1/partner/bookings/cancleBooking/verify/:bookingId", [authJwt.isPartner], auth.rejectBookingVerifyOtp);
    app.post("/api/v1/partner/bookings/cancleBooking/resendOtp/:id", [authJwt.isPartner], auth.rejectBookingResendOTP);
    app.get('/api/v1/partner/rejected-bookings', [authJwt.isPartner], auth.getRejectedBookingsForPartner);
    app.get('/api/v1/partner/accessories/partner', [authJwt.isPartner], auth.getAccessoryByPartnerId);
    app.get('/api/v1/partner/accessories/partner/store', [authJwt.isPartner], auth.getAccessoryByPartnerAndStore);
    app.put('/api/v1/partner/bookings/:bookingId/trip-end-details', [authJwt.isPartner], auth.updateTripEndDetails);
    app.post("/api/v1/partner/bookings/trip-end-details/verify/:bookingId", [authJwt.isPartner], auth.approveTripEndDetailsVerifyOtp);
    app.post("/api/v1/partner/bookings/trip-end-details/resendOtp/:id", [authJwt.isPartner], auth.approveTripEndDetailsResendOTP);
    app.get('/api/v1/partner/order', [authJwt.isPartner], auth.getAllOrdersForPartner);
    app.get('/api/v1/partner/order/:orderId', [authJwt.isPartner], auth.getOrderByIdForPartner);
    app.put('/api/v1/partner/order/:orderId', [authJwt.isPartner], auth.updateOrder);
    app.post("/api/v1/partner/order/status/:orderId", [authJwt.isPartner], auth.orderVerifyOtp);
    app.post("/api/v1/partner/order/status/resendOtp/:id", [authJwt.isPartner], auth.orderResendOTP);
    app.delete('/api/v1/partner/order/:orderId', [authJwt.isPartner], auth.deleteOrder);
    app.get('/api/v1/partner/QRCode/get', [authJwt.isPartner], auth.getQrCodeForVendor);
    app.put('/api/v1/partner/notifications/:notificationId', [authJwt.isPartner], auth.markNotificationAsRead);
    app.put('/api/v1/partner/notifications/markAll/read', [authJwt.isPartner], auth.markAllNotificationsAsRead);
    app.get('/api/v1/partner/notifications/user/:notificationId', [authJwt.isPartner], auth.getNotificationsById);
    app.get('/api/v1/partner/all/notifications/user', [authJwt.isPartner], auth.getAllNotificationsForUser);






}