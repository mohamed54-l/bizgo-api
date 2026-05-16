const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ BizGo API Moneroo fonctionne (Mode Axios)");
});

app.get("/payer", async (req, res) => {
  try {
    console.log("Clé API utilisée :", process.env.MONEROO_API_KEY ? "Existe" : "Absente");

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
        return_url: "https://bizgo-api-1.onrender.com/success",
        callback_url: "https://bizgo-api-1.onrender.com/ipn",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${process.env.MONEROO_API_KEY}`
        },
      }
    );

    console.log("✅ Réponse Moneroo brute :", response.data);

    // Sécurité pour choper l'URL peu importe comment Moneroo l'envoie
    const checkoutUrl = response.data?.data?.checkout_url || response.data?.checkout_url;

    if (checkoutUrl) {
      return res.redirect(checkoutUrl);
    } else {
      return res.status(400).json({
        message: "Impossible de trouver l'URL de redirection",
        debug: response.data
      });
    }

  } catch (error) {
    console.error("❌ Erreur Moneroo :", error.response?.data || error.message);
    return res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

app.post("/ipn", (req, res) => {
  console.log("🔔 Notification Moneroo :", req.body);
  res.send("OK");
});

app.get("/success", (req, res) => {
  res.send("🎉 Paiement réussi ! Bienvenue sur BizGo.");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur port ${PORT}`);
});