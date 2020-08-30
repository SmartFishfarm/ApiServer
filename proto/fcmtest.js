var admin = require("firebase-admin");

var serviceAccount = require("../config/dysapp.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://dysapp-54b0c.firebaseio.com"
});

//var time = new Date(new Date().getTime());


var target_token='fzVQzleZCBQ:APA91bGlEBRSOzCc4QVBgBMc64aBIC8XNL98TwRiAP10vokAwX5P8UacCvU2kW8GJw56YsuYemN5rmJJeg4juceHLSsJ1h1gVn-eM9CVmFm9s0O3Db4kNw2S4LIhRDQJP-fKiATMmQcj';


var fcm_message = {
  notification: {
    title: '범위이탈 알림',
    body: 'ff'
  },
  token: target_token
};

for(let i=0; i<4; i++) {

admin.messaging().send(fcm_message)
  .then(function(response) {
    console.log(response);
  })
  .catch(function(error) {
    console.log(error);
  });

}
