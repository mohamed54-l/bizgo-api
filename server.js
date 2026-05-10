const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

// 🔐 CLÉS CINETPAY DEPUIS RENDER
const ACCOUNT_KEY = process.env.CINETPAY_KEY;
const ACCOUNT_PASSWORD = process.env.CINETPAY_PASSWORD;

// 🟢 PAGE ACCUEIL
app.get("/", (req, res) => {
  res.send("✅ BizGo API fonctionne");
});

// 💳 ROUTE PAIEMENT
app.get("/payer", async (req, res) => {

  try {

    // 🔥 ID UNIQUE
    const merchant_transaction_id =
      "TX-" + Date.now();

    // 🚀 REQUÊTE API CINETPAY
    const response = await axios.post(

      "https://api-checkout.cinetpay.com/v1/payment",

      {

        currency: "XOF",

        amount: 2000,

        merchant_transaction_id:
          merchant_transaction_id,

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
          "BizGo",

        client_phone_number:
          "+22670000000",

        client_email:
          "test@bizgo.com",

        lang: "fr",

        direct_pay: false

      },

      {

        auth: {

          username: ACCOUNT_KEY,

          password: ACCOUNT_PASSWORD

        }

      }

    );

    // 📥 LOGS
    console.log(
      "✅ REPONSE CINETPAY :",
      response.data
    );

    // 🔥 URL PAIEMENT
    const payment_url =
      response.data.payment_url;

    // ❌ SI URL ABSENTE
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

// 🔔 NOTIFICATION IPN
app.post("/ipn", (req, res) => {

  console.log(
    "💰 Paiement reçu :",
    req.body
  );

  res.send("OK");

});

// ✅ SUCCESS
app.get("/success", (req, res) => {

  res.send("🎉 Paiement réussi");

});

// ❌ FAILED
app.get("/failed", (req, res) => {

  res.send("❌ Paiement échoué");

});

// 🚀 PORT
const PORT =
  process.env.PORT || 10000;

app.listen(PORT, () => {

  console.log(
    `🚀 Serveur lancé sur le port ${PORT}`
  );

});