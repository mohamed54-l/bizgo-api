const express = require("express");
const { CinetPayClient } = require("cinetpay-js");

const app = express();

app.use(express.json());

// 🔐 CLIENT CINETPAY
const client = new CinetPayClient({

  credentials: {

    CI: {

      apiKey:
        process.env.CINETPAY_API_KEY_CI,

      apiPassword:
        process.env.CINETPAY_API_PASSWORD_CI,

    },

  },

});

// 🟢 PAGE TEST
app.get("/", (req, res) => {

  res.send("✅ BizGo API fonctionne");

});

// 💳 ROUTE PAIEMENT
app.get("/payer", async (req, res) => {

  try {

    const orderId =
      "ORDER-" + Date.now();

    const payment =
      await client.payment.initialize(

        {

          currency: "XOF",

          merchantTransactionId:
            orderId,

          amount: 2000,

          lang: "fr",

          designation:
            "Abonnement BizGo",

          clientEmail:
            "test@bizgo.com",

          clientFirstName:
            "Mohamed",

          clientLastName:
            "Guebre",

          clientPhoneNumber:
            "+22670000000",

          successUrl:
            "https://bizgo-api-1.onrender.com/success",

          failedUrl:
            "https://bizgo-api-1.onrender.com/failed",

          notifyUrl:
            "https://bizgo-api-1.onrender.com/ipn",

          channel: "PUSH",

        },

        "CI"

      );

    console.log(
      "✅ Paiement :",
      payment
    );

    return res.redirect(
      payment.paymentUrl
    );

  }

  catch (error) {

    console.error(
      "❌ Erreur CinetPay :",
      error
    );

    return res.status(500).json(
      error.message || error
    );

  }

});

// 🔔 IPN
app.post("/ipn", (req, res) => {

  console.log(
    "💰 Notification :",
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
    `🚀 Serveur lancé sur port ${PORT}`
  );

});