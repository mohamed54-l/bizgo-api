const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

// 🔐 VARIABLES CINETPAY (Render Environment Variables)
const ACCOUNT_KEY = process.env.CINETPAY_KEY;
const ACCOUNT_PASSWORD = process.env.CINETPAY_PASSWORD;

// 🟢 PAGE PRINCIPALE
app.get("/", (req, res) => {
  res.send("✅ BizGo API fonctionne correctement");
});

// 💳 ROUTE DE PAIEMENT
app.get("/payer", async (req, res) => {

  try {

    // 🔥 ID UNIQUE
    const transaction_id =
      "TX-" + Date.now();

    // 🚀 APPEL API CINETPAY
    const response = await axios.post(

      "https://api-checkout.cinetpay.com/v2/payment",

      {

        amount: 2000,

        currency: "XOF",

        merchant_transaction_id:
          transaction_id,

        success_url:
          "https://bizgo-api-1.onrender.com/success",

        failed_url:
          "https://bizgo-api-1.onrender.com/failed",

        notify_url:
          "https://bizgo-api-1.onrender.com/ipn",

        designation:
          "Abonnement BizGo",

        client_first_name:
          "Mohamed",

        client_last_name:
          "Guebre",

        client_email:
          "test@bizgo.com",

        client_phone_number:
          "+22670000000",

        lang: "fr",

        direct_pay: false

      },

      {

        auth: {

          username: ACCOUNT_KEY,

          password: ACCOUNT_PASSWORD

        },

        headers: {

          "Content-Type":
            "application/json"

        }

      }

    );

    // 📥 LOGS
    console.log(
      "✅ REPONSE CINETPAY :",
      response.data
    );

    // 🔥 URL DE PAIEMENT
    const payment_url =
      response.data.payment_url;

    // ❌ SI PAS D’URL
    if (!payment_url) {

      return res.status(500).json(
        response.data
      );

    }

    // 🚀 REDIRECTION
    return res.redirect(payment_url);

  }

  catch (error) {

    console.error(
      "❌ ERREUR CINETPAY :",
      error.response?.data || error.message
    );

    return res.status(500).json(
      error.response?.data || error.message
    );

  }

});

// 🔔 WEBHOOK
app.post("/ipn", (req, res) => {

  console.log(
    "💰 Notification paiement :",
    req.body
  );

  res.send("OK");

});

// ✅ SUCCESS
app.get("/success", (req, res) => {

  res.send(
    "🎉 Paiement réussi"
  );

});

// ❌ FAILED
app.get("/failed", (req, res) => {

  res.send(
    "❌ Paiement échoué"
  );

});

// 🚀 PORT
const PORT =
  process.env.PORT || 10000;

app.listen(PORT, () => {

  console.log(
    `🚀 Serveur lancé sur le port ${PORT}`
  );

});