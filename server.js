const express = require("express");
const paydunya = require("paydunya");

const app = express();
app.use(express.json());

// 🔐 CONFIG PAYDUNYA
paydunya.setup({
  master_key: "**************************",
  public_key: "**************************",
  private_key: "**************************",
  token: "**************************",
  mode: "test"
});

// 🟢 ROUTE TEST
app.get("/", (req, res) => {
  res.send("🚀 BizGo API running");
});

// 💳 ROUTE FACTURE (VERSION STABLE)
app.get("/generer-facture", async (req, res) => {
  try {
    const invoice = new paydunya.CheckoutInvoice();

    // 🔁 URLs OBLIGATOIRES
    invoice.return_url = "https://bizgo-api.onrender.com/";
    invoice.cancel_url = "https://bizgo-api.onrender.com/";
    invoice.callback_url = "https://bizgo-api.onrender.com/ipn";

    // 📦 PRODUIT (FORMAT SIMPLE ET VALIDE)
    invoice.addItem("Test Bizgo", 1, 1000, 1000, "Paiement test");

    invoice.total_amount = 1000;
    invoice.description = "Paiement test Bizgo";

    // 🚀 CRÉATION
    await invoice.create();

    const url = invoice.getInvoiceUrl();

    console.log("🔗 URL paiement :", url);

    if (url) {
      return res.redirect(url);
    } else {
      return res.status(500).send("Erreur création facture");
    }

  } catch (error) {
    console.error("❌ Erreur PayDunya:", error);
    return res.status(500).send("Erreur: " + error.message);
  }
});

// 🔔 IPN
app.post("/ipn", (req, res) => {
  console.log("💰 Paiement reçu :", req.body);
  res.status(200).send("OK");
});

// 🌍 PORT RENDER
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur port ${PORT}`);
});