const express = require("express");
const { Moneroo } = require("moneroo"); // Importation du SDK officiel

const app = express();
app.use(express.json());

// 🔐 INITIALISATION DU SDK MONEROO
// Le SDK gère lui-même l'application des headers et des bonnes routes.
const moneroo = new Moneroo({
  secretKey: process.env.MONEROO_API_KEY,
});

app.get("/", (req, res) => {
  res.send("✅ BizGo API Moneroo fonctionne avec le SDK");
});

app.get("/payer", async (req, res) => {
  try {
    // Appel de la méthode officielle du SDK pour initialiser le paiement
    const response = await moneroo.payments.initialize({
      amount: 2000, // Le montant en XOF
      currency: "XOF",
      description: "Abonnement BizGo",
      return_url: "https://bizgo-api-1.onrender.com/success", // Moneroo utilise return_url
      customer: {
        name: "Mohamed",
        email: "test@bizgo.com",
        phone: "+22670000000",
      },
    });

    console.log("✅ Réponse Moneroo SDK :", response.data);

    // Le SDK renvoie l'URL dans la propriété checkout_url
    if (response.data && response.data.checkout_url) {
      return res.redirect(response.data.checkout_url);
    } else {
      throw new Error("L'URL de paiement (checkout_url) est introuvable.");
    }

  } catch (error) {
    console.error("❌ Erreur Moneroo SDK :", error.message || error);

    return res.status(500).json({
      error: error.message || "Erreur lors de l'initialisation du paiement",
    });
  }
});

// Webhook pour intercepter les validations de paiement
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