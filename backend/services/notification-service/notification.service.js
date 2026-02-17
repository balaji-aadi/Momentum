import admin from "../../utils/firebase.js";
import { FCMDevice } from "../../models/fcmdevice.model.js";


const notificationService = async (user_id, message) => {
  try {
    const query = user_id ? { user_id } : {}
    const devices = await FCMDevice.find(query);

    if (!devices || devices.length === 0) {
      console.error('No devices found for this user');
      return;
    }

    const tokens = devices.map(device => device.fcm_token).filter(token => token);

    if (tokens.length === 0) {
      console.error('No valid FCM tokens found');
      return;
    }

    const payload = {
      notification: {
        title: message.title,
        body: message.body,
      },
    };

    const response = await admin.messaging().sendEachForMulticast({
      tokens: tokens,
      ...payload,
    });

    console.log('Successfully sent messages:', response);
  } catch (error) {
    console.error('Error sending message:', error.message);
  }
  
};



export default notificationService