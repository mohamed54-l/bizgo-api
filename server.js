const express = require("express");
require('dotenv').config(); // Pour charger les variables si besoin

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ BizGo API Moneroo fonctionne avec le SDK");
});

app.get("/payer", async (req, res) => {
  try {
    // Importation dynamique du SDK pour éviter le crash au démarrage
    const { Moneroo } = await import("moneroo");
    
    const moneroo = new Moneroo({
      secretKey: process.env.MONEROO_API_KEY,
    });

    const response = await moneroo.payments.initialize({
      amount: 2000,
      currency: "XOF",
      description: "Abonnement BizGo",
      return_url: "https://bizgo-api-1.onrender.com/success",
      customer: {
        name: "Mohamed",
        email: "test@bizgo.com",
        phone: "+22670000000",
      },
    });

    console.log("✅ Réponse Moneroo SDK :", response.data);

    // Sécurité sur la récupération de l'URL selon la réponse du SDK
    const checkoutUrl = response.data?.checkout_url || response.checkout_url;

    if (checkoutUrl) {
      return res.redirect(checkoutUrl);
    } else {
      throw new Error("L'URL de paiement est introuvable dans la réponse.");
    }

  } catch (error) {
    console.error("❌ Erreur Moneroo SDK :", error.message || error);
    return res.status(500).json({
      error: error.message || "Erreur lors de l'initialisation du paiement",
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