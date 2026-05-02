const express = require("express");
const paydunya = require("paydunya");

const app = express();
app.use(express.json());

// 1. CONFIG PAYDUNYA (Version simplifiée)
paydunya.setup({
  master_key: "**************************",
  public_key: "**************************",
  private_key: "**************************",
  token: "**************************",
  mode: "test"
});

// On définit le nom du magasin directement dans l'objet Store
let store = new paydunya.Store({
  name: "BizGo Invoice App"
});

// PAGE TEST
app.get("/", (req, res) => {
  res.send("🚀 BizGo API running");
});

// 2. ROUTE FACTURE
app.get("/generer-facture", async (req, res) => {
  try {
    // On passe le 'store' ici pour éviter l'erreur de paramètres
    let invoice = new paydunya.CheckoutInvoice(store);

    const montantFacture = 10000;
    const clientNom = "Client Demo";

    // URLs de redirection (Vital pour Render)
    invoice.return_url = "https://bizgo-api.onrender.com/";
    invoice.cancel_url = "https://bizgo-api.onrender.com/";

    invoice.addItem("Facture BizGo", 1, montantFacture, montantFacture, "Prestation BizGo");
    invoice.total_amount = montantFacture;
    invoice.description = `Facture pour ${clientNom}`;

    await invoice.create();
    res.redirect(invoice.getInvoiceUrl());

  } catch (e) {
    console.error("Erreur PayDunya:", e);
    res.status(500).send("Erreur : " + e.message);
  }
});

// IPN
app.post("/ipn", (req, res) => {
  console.log("Paiement reçu :", req.body);
  res.status(200).send("OK");
});

// PORT RENDER
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Serveur lancé sur port " + PORT);
});