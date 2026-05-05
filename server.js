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
app.get("/generer-facture", async (req, res) => {
  try {
    const invoice = new paydunya.CheckoutInvoice();

    const montant = 1000;

    // ✅ CONFIGURATION OBLIGATOIRE DU STORE ICI
    invoice.store = {
      name: "BizGo",
      tagline: "Paiement sécurisé",
      postal_address: "Dakar",
      phone: "770000000"
    };

    // ✅ INFOS CLIENT (TRÈS IMPORTANT)
    invoice.customer = {
      name: "Client Test",
      email: "client@test.com",
      phone: "770000000"
    };

    // ✅ PRODUIT
    invoice.addItem(
      "Service BizGo",
      1,
      montant,
      montant,
      "Paiement test"
    );

    invoice.total_amount = montant;

    // ✅ URLs (OBLIGATOIRE)
    invoice.return_url = "https://bizgo-api.onrender.com/";
    invoice.cancel_url = "https://bizgo-api.onrender.com/";

    // 🚀 CREATE
    await invoice.create();

    const url = invoice.getInvoiceUrl();

    if (url) {
      return res.redirect(url);
    } else {
      return res.status(500).send("Erreur génération URL");
    }

  } catch (error) {
    console.error("❌ Erreur PayDunya:", error);
    return res.status(500).send(error.message);
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