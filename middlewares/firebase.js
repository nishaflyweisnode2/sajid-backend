// var FCM = require('fcm-node');


module.exports = {
  pushNotificationforUser: (deviceToken, title, body) => {
    return new Promise((resolve, reject) => {
      var serverKey = 'BLn0qGPQ5MCoHRISbtDadrxXovW6pYWD2VHcUQtnkMJHi0FF-BV2Hk8lYSIx-pzK0BoRhu6YDPVvyPKkKNpRYL8';
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