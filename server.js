const express = require("express");
const { CinetPayClient } = require("cinetpay-js");

const app = express();

app.use(express.json());

/*
==================================================
🔐 CONFIGURATION CINETPAY
==================================================
*/

const client = new CinetPayClient({

  credentials: {

    BF: {

      apiKey:
        process.env.CINETPAY_API_KEY,

      apiPassword:
        process.env.CINETPAY_API_PASSWORD,

    },

  },

});

/*
==================================================
🟢 ROUTE TEST
==================================================
*/

app.get("/", (req, res) => {

  res.send("✅ BizGo API fonctionne");

});

/*
==================================================
💳 ROUTE DE PAIEMENT
==================================================
*/

app.get("/payer", async (req, res) => {

  try {

    const orderId =
      "TX-" + Date.now();

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

          channel:
            "MOBILE_MONEY",

        },

        "BF"

      );

    /*
    ==========================================
    🔍 DEBUG
    ==========================================
    */

    console.log(
      "✅ Réponse paiement :",
      payment
    );

    /*
    ==========================================
    🚀 REDIRECTION
    ==========================================
    */

    const paymentUrl =

      payment.paymentUrl ||

      payment.payment_url ||

      payment.data?.payment_url;

    if (!paymentUrl) {

      return res.status(500).json({

        error:
          "URL paiement introuvable",

        response:
          payment,

      });

    }

    return res.redirect(paymentUrl);

  }

  catch (error) {

    console.error(
      "❌ Erreur CinetPay :",
      error
    );

    return res.status(500).json({

      message:
        "Erreur paiement",

      details:
        error.message ||

        error,

    });

  }

});

/*
==================================================
🔔 WEBHOOK / IPN
==================================================
*/

app.post("/ipn", (req, res) => {

  console.log(
    "🔔 Notification reçue :",
    req.body
  );

  res.send("OK");

});

/*
==================================================
✅ SUCCESS
==================================================
*/

app.get("/success", (req, res) => {

  res.send(
    "🎉 Paiement réussi !"
  );

});

/*
==================================================
❌ FAILED
==================================================
*/

app.get("/failed", (req, res) => {

  res.send(
    "❌ Paiement échoué."
  );

});

/*
==================================================
🚀 LANCEMENT SERVEUR
==================================================
*/

const PORT =
  process.env.PORT ||

  10000;

app.listen(PORT, () => {

  console.log(
    `🚀 BizGo API prête sur port ${PORT}`
  );

});