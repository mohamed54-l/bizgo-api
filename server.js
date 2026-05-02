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
  mode: "test" // change en "live" plus tard
});

// 🏪 STORE
const store = new paydunya.Store({
  name: "BizGo Invoice App"
});

// 🟢 ROUTE TEST
app.get("/", (req, res) => {
  res.send("🚀 BizGo API running");
});

// 💳 ROUTE FACTURE
app.get("/generer-facture", async (req, res) => {
  try {
    const invoice = new paydunya.CheckoutInvoice(store);

    const montantFacture = 1000; // ⚠️ commence petit pour test
    const clientNom = "Client Demo";

    // 🔁 URLs obligatoires
    invoice.return_url = "https://bizgo-api.onrender.com/";
    invoice.cancel_url = "https://bizgo-api.onrender.com/";

    // 📦 PRODUIT
    invoice.addItem(
      "Service BizGo",
      1,
      montantFacture,
      montantFacture,
      "Paiement test BizGo"
    );

    invoice.total_amount = montantFacture;
    invoice.description = `Facture BizGo pour ${clientNom}`;

    // 🚀 CRÉATION FACTURE
    await invoice.create();

    const paymentUrl = invoice.getInvoiceUrl();

    console.log("🔗 URL Paiement :", paymentUrl);

    if (paymentUrl) {
      return res.redirect(paymentUrl);
    } else {
      return res.status(500).send("Erreur: URL de paiement non générée");
    }

  } catch (error) {
    console.error("❌ Erreur PayDunya:", error);
    return res.status(500).send("Erreur serveur: " + error.message);
  }
});

// 🔔 IPN (confirmation paiement)
app.post("/ipn", (req, res) => {
  console.log("💰 Paiement reçu :", req.body);
  res.status(200).send("OK");
});

// 🌍 PORT RENDER
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur port ${PORT}`);
});