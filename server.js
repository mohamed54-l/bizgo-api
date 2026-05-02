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

    invoice.addItem(
      "Facture BizGo",
      1,
      montantFacture,
      montantFacture,
      "Prestation BizGo"
    );

    invoice.total_amount = montantFacture;
    invoice.description = `Facture pour ${clientNom}`;

    await invoice.create();

    res.redirect(invoice.getInvoiceUrl());
  } catch (e) {
    console.error(e);
    res.status(500).send("Erreur : " + e.message);
  }
});

// IPN (IMPORTANT 🔥)
app.post("/ipn", (req, res) => {
  console.log("Paiement reçu :", req.body);
  res.status(200).send("OK");
});

// PORT RENDER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Serveur lancé sur port " + PORT);
});