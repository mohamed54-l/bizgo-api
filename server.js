const express = require("express");
const axios = require("axios");
require('dotenv').config(); // Pour lire ton .env en local

const app = express();
app.use(express.json());

// 🔐 CINETPAY CONFIG (Depuis les variables d'environnement Render)
const API_KEY = process.env.CINETPAY_KEY; // sk_live_...
const SITE_ID = 714851; // Ton slug

app.get("/", (req, res) => {
  res.send("✅ BizGo API fonctionne");
});

app.get("/payer", async (req, res) => {
  try {
    const merchant_transaction_id = "TX" + Date.now();

    // 🚀 REQUÊTE CINETPAY (Format V2 plus stable avec les slugs)
    const response = await axios.post(
      "https://api-checkout.cinetpay.com/v2/payment",
      {
        apikey: API_KEY,
        site_id: SITE_ID,
        transaction_id: merchant_transaction_id,
        amount: 2000,
        currency: "XOF",
        description: "Abonnement BizGo",
        notify_url: "https://bizgo-api-1.onrender.com/ipn",
        return_url: "https://bizgo-api-1.onrender.com/success",
        channels: "ALL",
        customer_name: "Client",
        customer_surname: "BizGo",
        customer_email: "client@test.com",
        customer_phone_number: "+22670000000",
        customer_address: "Ouagadougou",
        customer_city: "Ouagadougou",
        customer_country: "BF",
        customer_state: "BF",
        customer_zip_code: "226",
        lang: "fr"
      }
    );

    console.log("✅ REPONSE CINETPAY :", response.data);

    // En V2, l'URL est dans data.payment_url
    const payment_url = response.data.data ? response.data.data.payment_url : null;

    if (!payment_url) {
      return res.status(500).send({
        msg: "CinetPay n'a pas renvoyé d'URL",
        debug: response.data
      });
    }

    return res.redirect(payment_url);

  } catch (error) {
    console.error("❌ ERREUR CINETPAY :", error.response?.data || error.message);
    return res.status(500).send(error.response?.data || error.message);
  }
});

// --- Reste du code (IPN, Success, Failed) identique ---
app.post("/ipn", (req, res) => {
  console.log("💰 Notification paiement :", req.body);
  res.send("OK");
});

app.get("/success", (req, res) => res.send("🎉 Paiement réussi"));
app.get("/failed", (req, res) => res.send("❌ Paiement échoué"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur port ${PORT}`);
});