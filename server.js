const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ BizGo API Moneroo fonctionne");
});

app.get("/payer", async (req, res) => {
  try {

    const response = await axios.post(
      "https://api.moneroo.io/v1/payments",
      {
        amount: 2000,
        currency: "XOF",
        description: "Abonnement BizGo",
        customer: {
          name: "Mohamed",
          email: "test@bizgo.com",
          phone: "+22670000000",
        },
        redirect_url: "https://bizgo-api-1.onrender.com/success",
        callback_url: "https://bizgo-api-1.onrender.com/ipn",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MONEROO_API_KEY}`,
          "X-App-ID": process.env.MONEROO_APP_ID,
        },
      }
    );

    console.log("✅ Réponse Moneroo :", response.data);

    return res.redirect(response.data.payment_url);

  } catch (error) {

    console.error(
      "❌ Erreur Moneroo :",
      error.response?.data || error.message
    );

    return res.status(500).json({
      error:
        error.response?.data || error.message,
    });

  }
});

app.post("/ipn", (req, res) => {

  console.log(
    "🔔 Notification Moneroo :",
    req.body
  );

  res.send("OK");

});

app.get("/success", (req, res) => {
  res.send("🎉 Paiement réussi !");
});

const PORT =
  process.env.PORT || 10000;

app.listen(PORT, () => {

  console.log(
    `🚀 Serveur lancé sur port ${PORT}`
  );

});