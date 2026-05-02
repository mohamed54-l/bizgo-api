const express = require("express");
const paydunya = require("paydunya");

const app = express();
app.use(express.json());

// CONFIG PAYDUNYA
paydunya.setup({
  master_key: "**************************",
  public_key: "**************************",
  private_key: "**************************",
  token: "**************************",
  mode: "test"
});

// CONFIGURATION DU MAGASIN (Obligatoire pour éviter "Invalid parameters")
paydunya.config.set_app_name("BizGo Invoice App");
paydunya.config.set_status_url("https://bizgo-api.onrender.com/ipn"); // Ton URL IPN sur Render

// PAGE TEST
app.get("/", (req, res) => {
  res.send("🚀 BizGo API running");
});

// ROUTE FACTURE
app.get("/generer-facture", async (req, res) => {
  try {
    let invoice = new paydunya.CheckoutInvoice();

    const montantFacture = 10000;
    const clientNom = "Client Demo";

    // 1. Ajout des URLs de redirection (Vital pour Render)
    invoice.return_url = "https://bizgo-api.onrender.com/";
    invoice.cancel_url = "https://bizgo-api.onrender.com/";

    // 2. Ajout de l'article
    invoice.addItem(
      "Facture BizGo",
      1,
      montantFacture,
      montantFacture,
      "Prestation BizGo"
    );

    // 3. Configuration du montant total
    invoice.total_amount = montantFacture;
    invoice.description = `Facture pour ${clientNom}`;

    // 4. Création avec gestion d'erreur plus précise
    const success = await invoice.create();
    
    if (success) {
        res.redirect(invoice.getInvoiceUrl());
    } else {
        res.status(400).send("Échec de la création de la facture : " + invoice.response_text);
    }
    
  } catch (e) {
    console.error("Erreur PayDunya:", e);
    res.status(500).send("Erreur : " + e.message);
  }
});

// IPN (IMPORTANT 🔥)
app.post("/ipn", (req, res) => {
  console.log("Paiement reçu :", req.body);
  res.status(200).send("OK");
});

// PORT RENDER
const PORT = process.env.PORT || 10000; // Render utilise souvent 10000 par défaut

app.listen(PORT, () => {
  console.log("Serveur lancé sur port " + PORT);
});