const auth = require("../controllers/userController");
const express = require("express");
const router = express()


const authJwt = require("../middlewares/auth");

const { profileImage, storiesImage } = require('../middlewares/imageUpload');



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
    app.delete('/api/v1/user/delete-account', [authJwt.verifyToken], auth.deleteAccount);
    app.post("/api/v1/user/delete-account/:id", [authJwt.verifyToken], auth.verifyOtpForDelete);
    app.post("/api/v1/user/resendOtp/delete-account/:id", [authJwt.verifyToken], auth.resendOTPForDelete);
    app.get("/api/v1/user/city/cities", [authJwt.verifyToken], auth.getAllCities);
    app.get("/api/v1/user/city/cities/:id", [authJwt.verifyToken], auth.getCityById);
    app.post('/api/v1/user/address/create', [authJwt.verifyToken], auth.createAddress);
    app.get('/api/v1/user/address/getAll', [authJwt.verifyToken], auth.getAllAddress);
    app.get('/api/v1/user/address/:id', [authJwt.verifyToken], auth.getAddressById);
    app.put('/api/v1/user/address/:id', [authJwt.verifyToken], auth.updateAddressById);
    app.delete('/api/v1/user/address/:id', [authJwt.verifyToken], auth.deleteAddressById);
    app.get('/api/v1/user/address/type/:type', [authJwt.verifyToken], auth.getAddressByType);
    app.get('/api/v1/user/bikes', [authJwt.verifyToken], auth.getAllBikes);
    app.get('/api/v1/user/bikes/:id', [authJwt.verifyToken], auth.getBikeById);
    app.get('/api/v1/user/coupons', [authJwt.verifyToken], auth.getAllCoupons);
    app.get('/api/v1/user/coupons/:id', [authJwt.verifyToken], auth.getCouponById);
    app.get('/api/v1/user/categories', [authJwt.verifyToken], auth.getAllAccessoryCategories);
    app.get('/api/v1/user/categories/:categoryId', [authJwt.verifyToken], auth.getAccessoryCategoryById);
    app.get('/api/v1/user/accessories', [authJwt.verifyToken], auth.getAllAccessories);
    app.get('/api/v1/user/accessories/:accessoryId', [authJwt.verifyToken], auth.getAccessoryById);
    app.get('/api/v1/user/accessories/bike/:bikeId', [authJwt.verifyToken], auth.getAllAccessoriesByBikeId);
    app.get('/api/v1/user/accessories/category/:categoryId', [authJwt.verifyToken], auth.getAllAccessoriesByCategoryId);
    app.get('/api/v1/user/store/details/:bikeId', [authJwt.verifyToken], auth.getStoreDetails);
    app.get('/api/v1/user/store/accessories/details/:accessoriesId', [authJwt.verifyToken], auth.getStoreDetailsForAccessories);
    app.get('/api/v1/user/bike/availability', [authJwt.verifyToken], auth.checkBikeAvailability);
    app.post("/api/v1/user/booking/create", [authJwt.verifyToken], auth.createBooking);
    app.get('/api/v1/user/bookings/user', [authJwt.verifyToken], auth.getBookingsByUser);
    app.get('/api/v1/user/bookings/user/:bookingId', [authJwt.verifyToken], auth.getBookingsById);
    app.get('/api/v1/user/bookings/completed/user', [authJwt.verifyToken], auth.getCompletedBookingsByUser);
    app.get('/api/v1/user/bookings/cancel/user', [authJwt.verifyToken], auth.getCancelBookingsByUser);
    app.get('/api/v1/user/bookings/upcoming/user', [authJwt.verifyToken], auth.getUpcomingBookingsByUser);
    app.put('/api/v1/user/bookings/:id', [authJwt.verifyToken], auth.updateBookingById);
    app.post('/api/v1/user/coupon/apply-coupon', [authJwt.verifyToken], auth.applyCouponToBooking);
    app.post('/api/v1/user/coupon/remove-coupon', [authJwt.verifyToken], auth.removeCouponFromBooking);
    app.post('/api/v1/user/wallet/apply-wallet', [authJwt.verifyToken], auth.applyWalletToBooking);
    app.put('/api/v1/user/bookings/updatePaymentStatus/:bookingId', [authJwt.verifyToken], auth.updatePaymentStatus);
    app.post('/api/v1/user/bookings/:bookingId/extend', [authJwt.verifyToken], auth.extendBooking);
    app.put('/api/v1/user/bookings/:bookingId/cancel', [authJwt.verifyToken], auth.cancelBooking);
    app.get('/api/v1/user/booking/:bookingId/refund', [authJwt.verifyToken], auth.getRefundStatusAndAmount);
    app.get('/api/v1/user/inquiries', [authJwt.verifyToken], auth.getInquiries);
    app.get('/api/v1/user/inquiries/:inquiryId', [authJwt.verifyToken], auth.getInquiryById);
    app.put('/api/v1/user/inquiries/:inquiryId', [authJwt.verifyToken], auth.replyToInquiry);
    app.put('/api/v1/user/notifications/:notificationId', [authJwt.verifyToken], auth.markNotificationAsRead);
    app.get('/api/v1/user/notifications/user/:userId', [authJwt.verifyToken], auth.getNotificationsForUser);
    app.get('/api/v1/user/notifications/user', [authJwt.verifyToken], auth.getAllNotificationsForUser);
    app.get('/api/v1/user/terms-and-conditions', [authJwt.verifyToken], auth.getAllTermAndCondition);
    app.get('/api/v1/user/terms-and-conditions/:id', [authJwt.verifyToken], auth.getTermAndConditionById);
    app.get('/api/v1/user/cancelation-policy', [authJwt.verifyToken], auth.getAllCancelationPolicy);
    app.get('/api/v1/user/cancelation-policy/:id', [authJwt.verifyToken], auth.getCancelationPolicyById);
    app.post('/api/v1/user/bussines/Inquary', [authJwt.verifyToken], auth.createBussinesInquary);
    app.get('/api/v1/user/bussinesInquary', [authJwt.verifyToken], auth.getBussinesInquary);
    app.get('/api/v1/user/bussinesInquary/:bussinesInquaryId', [authJwt.verifyToken], auth.getBussinesInquaryById);
    app.put('/api/v1/user/bussinesInquary/:bussinesInquaryId', [authJwt.verifyToken], auth.updateBussinesInquary);
    app.delete('/api/v1/user/bussinesInquary/:bussinesInquaryId', [authJwt.verifyToken], auth.deleteBussinesInquary);
    app.post('/api/v1/user/stories/1', [authJwt.verifyToken], storiesImage.array('image'), auth.createStory);
    app.get('/api/v1/user/stories', [authJwt.verifyToken], auth.getAllStories);
    app.get('/api/v1/user/stories/:storyId', [authJwt.verifyToken], auth.getStoryById);
    app.post('/api/v1/user/accessories/order', [authJwt.verifyToken], auth.createOrder);
    app.get('/api/v1/user/order', [authJwt.verifyToken], auth.getAllOrders);
    app.get('/api/v1/user/order/:orderId', [authJwt.verifyToken], auth.getOrderById);
    app.put('/api/v1/user/order/:orderId', [authJwt.verifyToken], auth.updateOrder);
    app.delete('/api/v1/user/order/:orderId', [authJwt.verifyToken], auth.deleteOrder);
    app.get('/api/v1/user/subject/categories', [authJwt.verifyToken], auth.getAllSubjectsCategories);
    app.get('/api/v1/user/subject/categories/:subjectId', [authJwt.verifyToken], auth.getSubjectsCategoryById);

}