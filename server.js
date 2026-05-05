const express = require("express");
const paydunya = require("paydunya");

const app = express();
app.use(express.json());

// 🔐 CONFIG PAYDUNYA (MET TES VRAIES CLÉS)
paydunya.setup({
  master_key: "TON_MASTER_KEY",
  public_key: "TON_PUBLIC_KEY",
  private_key: "TON_PRIVATE_KEY",
  token: "TON_TOKEN",
  mode: "test" // passe à "live" plus tard
});

// 🟢 ROUTE TEST
app.get("/", (req, res) => {
  res.send("🚀 BizGo API fonctionne");
});

// 💳 ROUTE FACTURE (VERSION STABLE)
app.get("/generer-facture", async (req, res) => {
  try {
    const invoice = new paydunya.CheckoutInvoice();

    const montant = 1000;

    // ✅ STORE (FORMAT CORRECT)
    invoice.store = {
      name: "BizGo",
      tagline: "Paiement sécurisé",
      postal_address: "Dakar",
      phone_number: "770000000"
    };

    // ✅ CLIENT (FORMAT CORRECT)
    invoice.customer = {
      name: "Client Test",
      email: "test@gmail.com",
      phone_number: "770000000"
    };

    // ✅ PRODUIT
    invoice.addItem("Service BizGo", 1, montant, montant);

    // ✅ TOTAL
    invoice.total_amount = montant;

    // ✅ URLS OBLIGATOIRES
    invoice.return_url = "https://bizgo-api.onrender.com/";
    invoice.cancel_url = "https://bizgo-api.onrender.com/";

    // 🚀 CRÉATION FACTURE
    const response = await invoice.create();

    console.log("📦 Réponse PayDunya:", response);

    // ✅ VÉRIFICATION
    if (response && response.response_code === "00") {
      const paymentUrl = invoice.response_text;
      return res.redirect(paymentUrl);
    } else {
      return res.status(500).json(response);
    }

  } catch (error) {
    console.error("❌ Erreur PayDunya:", error);
    return res.status(500).send(error.message);
  }
});

// 🔔 IPN (confirmation paiement)
app.post("/ipn", (req, res) => {
  console.log("💰 Paiement reçu :", req.body);
  res.sendStatus(200);
});

// 🌍 PORT RENDER
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur port ${PORT}`);
});