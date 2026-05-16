const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

// 🟢 PAGE D'ACCUEIL TEST
app.get("/", (req, res) => {
  res.send("✅ BizGo API Moneroo fonctionne parfaitement !");
});

// 💳 ROUTE INITIALISATION DU PAIEMENT
app.get("/payer", async (req, res) => {
  try {
    console.log("🚀 Tentative d'initialisation du paiement Moneroo...");

    // La vraie route API Moneroo pour créer un paiement est /v1/payments/initialize
    const response = await axios.post(
      "https://api.moneroo.io/v1/payments/initialize",
      {
        amount: 2000,
        currency: "XOF",
        description: "Abonnement BizGo",
        customer: {
          name: "Mohamed Guebre",
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
          "Authorization": `Bearer ${process.env.MONEROO_API_KEY}`,
        },
      }
    );

    console.log("✅ Réponse Moneroo brute :", response.data);

    // Extraction sécurisée de l'URL de paiement selon la structure de leur JSON (data.checkout_url)
    const checkoutUrl = response.data?.data?.checkout_url || response.data?.checkout_url;

    if (checkoutUrl) {
      console.log("➡️ Redirection de l'utilisateur vers :", checkoutUrl);
      return res.redirect(checkoutUrl);
    } else {
      return res.status(400).json({
        message: "L'URL de paiement n'a pas pu être extraite de la réponse.",
        debug: response.data,
      });
    }

  } catch (error) {
    console.error("❌ Erreur Moneroo :", error.response?.data || error.message);

    return res.status(500).json({
      error: "Échec de la communication avec Moneroo",
      details: error.response?.data || error.message,
    });
  }
});

// 🔔 IPN / WEBHOOK (Notification automatique en arrière-plan)
app.post("/ipn", (req, res) => {
  console.log("🔔 Notification de paiement reçue de Moneroo :", req.body);
  
  // C'est ici que tu mettras plus tard la logique pour passer l'utilisateur en "Premium"
  
  res.status(200).send("OK");
});

// 🎉 PAGE DE SUCCÈS (Redirection après paiement réussi)
app.get("/success", (req, res) => {
  res.send("🎉 Paiement réussi ! Bienvenue sur ton espace BizGo.");
});

// 🚀 CONFIGURATION DU PORT RENDER
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur BizGo en ligne et à l'écoute sur le port ${PORT}`);
});