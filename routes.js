// routes/stkpush.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

router.post("/stkpush", async (req, res) => {
  const phone = req.body.phone || "254708374149";
  const amount = req.body.amount || 1;

  const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
  const password = Buffer.from(`${process.env.SHORTCODE}${process.env.PASSKEY}${timestamp}`).toString('base64');

  try {
    const { data: tokenRes } = await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.CONSUMER_KEY}:${process.env.CONSUMER_SECRET}`).toString("base64")}`
      }
    });

    const access_token = tokenRes.access_token;

    const stkRes = await axios.post("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
      BusinessShortCode: process.env.SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: process.env.CALLBACK_URL || "https://your-callback-url.com",
      AccountReference: "Starlink",
      TransactionDesc: "Starlink Data Bundle"
    }, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    res.status(200).json({ success: true, data: stkRes.data });

  } catch (error) {
    console.error("STK Push Error:", error?.response?.data || error.message);
    res.status(500).json({ success: false, error: error?.response?.data || error.message });
  }
});

module.exports = router;
