var FCM = require('fcm-node');


module.exports = {
    pushNotificationforUser: (deviceToken, title, body) => {
      return new Promise((resolve, reject) => {
        var serverKey = 'AAAALBHVLdY:APA91bEvOzvyZ9QODspc4-36_hTs_k5AmAhagPNY6CGC6HCGzozKayrBnSfr6y0TEnpxhupiJeY7-szp_9Ty0s9rWZMg7p8P_SOxru07yAQrMLicr_Q9mM6EdskBKUXx3FsoJVErQKFE';
        var fcm = new FCM(serverKey);
        var message = { to: deviceToken, "content_available": true, notification: { title: title, body: body } };
        fcm.send(message, function (err, response) {
          if (err) {
            console.log(">>>>>>>>>>", err)
            return resolve(err);
          } else {
            console.log(">>>>>>>>>response", response)
            return resolve(response);
  
          }
        });
      });
    },
  }