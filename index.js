
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Safaricom Daraja Test Credentials
const shortcode = "174379";
const consumerKey = "<YOUR_CONSUMER_KEY>";
const consumerSecret = "<YOUR_CONSUMER_SECRET>";
const passkey = "bfb279f9aa9bdbcf113b0b1af8b770b6"; // test passkey
const callbackURL = "<YOUR_CALLBACK_URL>"; // replace with your real domain

// Base64 encode credentials
const base64Encode = (str) => Buffer.from(str).toString('base64');

// Generate timestamp
const getTimestamp = () => {
  const now = new Date();
  return now.getFullYear().toString() +
    ("0" + (now.getMonth() + 1)).slice(-2) +
    ("0" + now.getDate()).slice(-2) +
    ("0" + now.getHours()).slice(-2) +
    ("0" + now.getMinutes()).slice(-2) +
    ("0" + now.getSeconds()).slice(-2);
};

// Get access token
async function getAccessToken() {
  const credentials = base64Encode(consumerKey + ":" + consumerSecret);
  const response = await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
    headers: {
      Authorization: "Basic " + credentials,
    },
  });
  return response.data.access_token;
}

// Initiate STK Push
app.post("/api/stk", async (req, res) => {
  try {
    const { phone, amount, reference } = req.body;
    const accessToken = await getAccessToken();
    const timestamp = getTimestamp();
    const password = base64Encode(shortcode + passkey + timestamp);

    const stkData = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: callbackURL,
      AccountReference: reference,
      TransactionDesc: "Starlink Bundle"
    };

    const stkResponse = await axios.post("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", stkData, {
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    });

    res.status(200).json({ message: "STK push initiated", data: stkResponse.data });
  } catch (error) {
    console.error("STK Error:", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to initiate STK push", error: error.response?.data || error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
